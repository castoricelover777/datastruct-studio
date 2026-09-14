/*
 * ============================================================================
 *  LinkList Studio —— 带头结点的单链表（严蔚敏《数据结构》风格）
 *  参考代码 · 第一部分：基础定义与建立
 * ============================================================================
 *
 *  本文件是 LinkList Studio 的唯一参考源码，同时承担两个角色：
 *
 *    1. 它本身是一份可以正常编译运行的 C 程序（所有训练标记都是 // 注释）；
 *    2. 它是"模块 / 三档注释"的数据源，由 tools/parse.js 解析：
 *
 *         //%module | 编号 | 函数名 | 中文标题 | 难度 | 依赖模块
 *         //%summary | 一句话作用
 *         //@s  关键步骤注释   → 详细注释 + 精简注释 都显示
 *         //@d  逐行补充/图示  → 只在详细注释显示
 *
 *    剥掉全部 //@ 行就得到"无注释"骨架，因此三种模式下的代码
 *    字符完全一致：签名、变量名、缩进、空行都不受影响。
 * ============================================================================
 */

//%module | 01 | 头文件与 typedef | 头文件与 typedef 结构体定义 | 1 |
//%summary | 引入标准库，用 typedef 把 struct LNode 包装成好写又好读的类型名。
//@d ============ 为什么要 typedef ============
//@d C 语言里 struct LNode 必须连在一起写，typedef 之后：
//@d     LNode     等价于  struct LNode
//@d     LinkList  等价于  struct LNode *
//@d 从此代码里只出现 LNode / LinkList，可读性大幅提升。
//@d 注意 LinkList 是"指针类型"，所以 LinkList L 本身就是一个指针变量。

//@s 标准输入输出，printf 需要
#include <stdio.h>
//@s 内存管理，malloc / free 需要
#include <stdlib.h>

//@s 用宏定义状态码，让函数返回值有意义（比裸 1 / 0 好读）
//@d 约定：函数返回 Status，OK 表示成功，ERROR 表示失败。
#define OK 1
//@d #define 是预处理指令，编译前做文本替换：代码里 OK 直接变成 1
#define ERROR 0
//@s 布尔值宏，教材习惯写法
#define TRUE 1
#define FALSE 0
//@d 内存分配失败的专用错误码，取一个和 OK/ERROR 都不冲突的负数
#define OVERFLOW -2

//@s Status 是函数返回类型；ElemType 是数据域类型
//@d 把 int 换成 float / char，整份代码不用改，这就是 typedef 的价值
typedef int Status;
typedef int ElemType;

//@s 结点结构体：数据域 data + 指针域 next
//@d ============ 内存里长什么样 ============
//@d
//@d   头结点(不存数据)        第 1 个结点          第 2 个结点
//@d   ┌────┬──────┐      ┌────┬──────┐      ┌────┬──────┐
//@d   │ -- │ next │─────▶│ 10 │ next │─────▶│ 20 │ NULL │
//@d   └────┴──────┘      └────┴──────┘      └────┴──────┘
//@d      L                 L->next            带数据的第一颗
//@d
//@d 头结点是"哨兵"：它不存有效数据，只为让插入/删除不用特判第一个位置。
typedef struct LNode {
//@s 数据域，存具体元素
    ElemType data;
//@s 指针域，指向下一个结点；最后一个结点为 NULL
//@d struct LNode *next 不能写成 LNode *next —— 此时 LNode 这个名字还没生效
    struct LNode *next;
//@s 一次 typedef 出两个名字：LNode（结点）和 LinkList（指向结点的指针）
} LNode, *LinkList;
//%end

//%module | 02 | creatNode | creatNode —— 创建新节点 | 1 | 01
//%summary | 向系统申请一块 LNode 大小的内存，填好数据域和指针域后返回它的地址。
//@d ============ 这个函数是后面所有插入操作的地基 ============
//@d 任何"插入"最终都要先造出一个新结点，思路永远是：
//@d   申请内存 → 填数据 → 指针域置 NULL → 把地址交出去
//@d 内存申请必须检查失败！malloc 失败返回 NULL，直接解引用会崩溃。

//@s 返回新结点的地址，所以返回类型是 LNode *
//@d 参数 e 按值传递：函数内改 e 不影响调用者，因为我们只需要它的值
LNode *creatNode(ElemType e)
{
//@s 申请一个结点大小的内存，强制转换成 LNode *
//@d sizeof(LNode) 通常等于 8（int 4 字节 + 指针 4 字节）或 16（64 位下指针 8 字节）
    LNode *p = (LNode *)malloc(sizeof(LNode));

//@s 申请失败必须拦住，否则后面 p->data 就是非法访问
    if (p == NULL)
    {
//@d printf 打印中文提示，让使用者知道是内存不够，而不是程序莫名其妙退出
        printf("内存分配失败：无法创建新结点。\n");
//@s 申请不到内存属于致命错误，直接结束程序
        exit(OVERFLOW);
    }

//@s 填数据域
    p->data = e;
//@s 新结点的 next 必须先置 NULL，否则它是野指针
//@d 这是最容易漏的一步：漏了之后链表尾部就不"封口"，遍历会冲到非法内存
    p->next = NULL;

//@s 把新结点的地址返回给调用者
    return p;
}
//%end

//%module | 03 | InitList | InitList —— 初始化带头结点链表 | 1 | 01
//%summary | 建立只有头结点的空表：申请头结点、让它的 next 指向 NULL。
//@d ============ 为什么需要"头结点" ============
//@d 没有头结点时，在第一个位置插入/删除都要单独写一段代码；
//@d 有了头结点，第一个位置和中间位置的操作逻辑完全一样，代码短一半。
//@d
//@d   初始化完成后：   L ──▶ ┌────┬──────┐
//@d                          │ -- │ NULL │
//@d                          └────┴──────┘

//@s 参数是 LinkList *（二级指针），因为要修改调用者手里的 L 本身
//@d 如果写成 LinkList L，函数内改了 L 也传不回去，调用者的 L 还是野指针
Status InitList(LinkList *L)
{
//@s 只申请头结点，不存数据
    *L = (LinkList)malloc(sizeof(LNode));
//@s 头结点也可能申请失败
    if (*L == NULL) return ERROR;
//@s 空表的标志：头结点的 next 为 NULL
    (*L)->next = NULL;
//@s 返回 OK 表示初始化成功
    return OK;
}
//%end

//%module | 04 | applist | applist —— 尾部追加节点 | 2 | 01,02,03
//%summary | 顺着 next 一路走到最后一个结点，把新结点挂到它后面。
//@d ============ 指针推进过程 ============
//@d 目标：在尾部追加 30
//@d
//@d  初始：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
//@d          p
//@d
//@d  循环：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
//@d                              p        （p->next != NULL，继续走）
//@d
//@d  停止：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
//@d                                     p   （p->next == NULL，p 就是尾结点）
//@d
//@d  挂上：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
//@d 关键：p 从头结点起步，不是从 L->next 起步 —— 这样空表也能正确处理。

//@s 参数 L 是头结点指针，不需要改 L 本身，所以不用二级指针
//@d 返回值用 Status，让调用者知道追加成功与否
Status applist(LinkList L, ElemType e)
{
//@s p 是"游标"，从头结点开始；它最终会停在尾结点上
    LNode *p = L;
//@s s 用来接住 creatNode 造出来的新结点
    LNode *s = NULL;

//@s 防御：L 为空说明没初始化过，直接报错
    if (L == NULL) return ERROR;

//@s 一路向后走，直到 p 后面没有结点了
//@d 循环条件是 p->next != NULL，看的永远是"下一个"，所以停下时 p 正是尾结点
    while (p->next != NULL)
    {
//@s 指针后移一格
        p = p->next;
    }

//@s 造新结点，地址交给 s
    s = creatNode(e);

//@s 把新结点接到尾结点后面，链表就延长了一节
//@d 只需要改一处指针；原来的尾结点 next 从 NULL 变成指向 s
    p->next = s;

//@s 返回 OK 表示追加成功
    return OK;
}
//%end

//%module | 05 | HeadInsert | HeadInsert —— 头插法插入节点 | 1 | 01,02
//%summary | 把新结点直接挂到头结点后面，成为新的第一个结点，完全不需要遍历。
//@d ============ 头插法 vs 尾插法 ============
//@d
//@d   applist（尾插）  ：从头一路走到尾，找到尾结点再挂上    —— 时间复杂度 O(n)
//@d   HeadInsert（头插）：直接插在头结点后面，碰都不碰其他结点 —— 时间复杂度 O(1)
//@d
//@d 代价是头插会**颠倒顺序**：依次头插 10、20、30，得到的是 30 -> 20 -> 10。
//@d 这不是缺陷，恰恰是头插法最常用的一个特性 —— "头插法建表"就是靠它做逆序的：
//@d
//@d     LinkList L;
//@d     InitList(&L);
//@d     for (i = 0; i < n; i++)
//@d     {
//@d         HeadInsert(L, a[i]);     /* 建出来的表正好是数组 a 的逆序 */
//@d     }
//@d
//@d 再记住一个等价关系：HeadInsert(L, e) 和 ListInsert(L, 1, e) 干的是同一件事，
//@d 前者只是把"找第 0 个结点"这一步省掉了 —— 因为头结点本身就是第 0 个。
//@d
//@d ============ 两步指针操作，顺序不能反 ============
//@d 目标：把 5 头插进 10 -> 20 -> 30
//@d
//@d  插入前：   L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
//@d
//@d  第一步（新结点先接住原来的头一个）：s->next = L->next
//@d            L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
//@d                          ▲
//@d            [5] ──────────┘
//@d             s
//@d
//@d  第二步（头结点再指向新结点）：L->next = s
//@d            L ─▶ [头] ─▶ [5] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
//@d                          s
//@d
//@d 头结点 [头] 本身始终待在原地，头插法动的只是它的 next 指针。

//@s 参数 L 是头结点指针，不需要改 L 本身，所以不用二级指针
//@d 位置固定是第 1 位，所以不像 ListInsert 那样需要 i 这个参数
Status HeadInsert(LinkList L, ElemType e)
{
//@s s 是等待挂链的新结点
    LNode *s = NULL;

//@s 防御：L 为空说明没初始化过，直接报错
    if (L == NULL) return ERROR;

//@s 造新结点
    s = creatNode(e);

//@s 第一步：新结点先接住原来头结点后面的那一串
//@d 做完这一步，链表本身还是完整的，只是多了一个"悬挂"在外面的 s
    s->next = L->next;
//@s 第二步：头结点再指向新结点，s 正式成为第 1 个结点
//@d 顺序同样不能反！先执行 L->next = s 的话，原来第一个结点的地址就丢了（内存泄漏）
    L->next = s;

//@s 插入成功
    return OK;
}
//%end
