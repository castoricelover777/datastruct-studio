/*
 * ============================================================================
 *  LinkList Studio —— 带头结点的双向链表（严蔚敏《数据结构》风格）
 *  参考代码 · 第一部分：类型定义与基础建立
 * ============================================================================
 *
 *  双向链表和单链表在结构上只差一个指针：每个结点除了 next（后继），
 *  还多一个 prior（前驱）。
 *
 *      单链表结点：  ┌──────┬──────┐
 *                    │ data │ next │
 *                    └──────┴──────┘
 *
 *      双向结点：    ┌──────┬──────┬──────┐
 *                    │prior │ data │ next │
 *                    └──────┴──────┴──────┘
 *
 *  多花一个指针的空间，换来两件事：
 *    1. 可以"往回走" —— 从任意结点直接拿到它的前驱，不用从头再遍历一遍；
 *    2. 删除结点时不必再找前驱 —— 单链表删除必须从头找到第 i-1 个结点，
 *       双向链表定位到第 i 个结点后，用 p->prior 就够了。
 *
 *  代价是每次改链都要**同时维护两个方向**，漏掉一个方向就会"正着走没事、
 *  反着走崩掉"。本部分之后每个插入操作都会强调这一点。
 *
 *  与单链表教材相同的标记约定：
 *
 *     //%module | 编号 | 函数名 | 中文标题 | 难度 | 依赖模块
 *     //%summary | 一句话作用
 *     //@s  关键步骤注释   → 详细注释 + 精简注释 都显示
 *     //@d  逐行补充/图示  → 只在详细注释显示
 * ============================================================================
 */

//%module | 01 | 头文件与 typedef | 头文件与 typedef 双向结点结构体 | 1 |
//%summary | 引入标准库，把双向结点 struct DuLNode 包装成 DuLNode / DuLinkList。
//@d ============ 相比单链表，结构体里多了什么 ============
//@d
//@d   单链表：  typedef struct LNode  { ElemType data; struct LNode  *next;  } LNode,  *LinkList;
//@d   双向链表：typedef struct DuLNode { ElemType data; struct DuLNode *prior;
//@d                                                     struct DuLNode *next;  } DuLNode, *DuLinkList;
//@d
//@d 就多了一个 prior。命名上习惯用 Du 前缀（double）把两者区分开 ——
//@d 一份代码里同时出现单链表和双向链表时，这个前缀能救命。
//@d
//@d ============ 内存里长什么样 ============
//@d
//@d   [头] ⇄ [10] ⇄ [20] ⇄ [30]
//@d    L
//@d
//@d 屏幕上每个 ⇄ 在内存里其实是**两根方向相反**的指针。
//@d 把每个结点的两个指针摊开列出来：
//@d
//@d   [头]：prior = NULL、next = [10]
//@d   [10]：prior = [头]、next = [20]
//@d   [20]：prior = [10]、next = [30]
//@d   [30]：prior = [20]、next = NULL
//@d
//@d 只有头结点的 prior 是 NULL（它前面没有结点了），
//@d 只有尾结点的 next 是 NULL（它后面没有结点了）。
//@d 这两条性质后面写插入、删除时会反复用到 —— 尤其是"要不要判空"。

//@s 标准输入输出，printf 需要
#include <stdio.h>
//@s 内存管理，malloc / free 需要
#include <stdlib.h>

//@s 用宏定义状态码，让函数返回值有意义（比裸 1 / 0 好读）
//@d 约定：函数返回 Status，OK 表示成功，ERROR 表示失败
#define OK 1
#define ERROR 0
#define TRUE 1
#define FALSE 0
//@d 内存分配失败的专用错误码，取一个和 OK/ERROR 都不冲突的负数
#define OVERFLOW -2

//@s Status 是函数返回类型；ElemType 是数据域类型
typedef int Status;
typedef int ElemType;

//@s 双向结点：数据域 + 前驱指针 + 后继指针
//@d 两个指针的分工：
//@d   prior  指向前一个结点，头结点和"第一个数据结点"的 prior 关系要注意
//@d   next   指向后一个结点，最后一个结点的 next 是 NULL
//@d
//@d 有一条贯穿全书的等式，插入删除时全靠它自检：
//@d
//@d     p->next->prior == p        以及        p->prior->next == p
//@d
//@d 也就是"我指向谁，谁就得指回我"。写双向链表的代码时，每改一次指针
//@d 都拿这句话对一遍，基本不会错。
typedef struct DuLNode {
//@s 数据域，存具体元素
    ElemType data;
//@s 前驱指针：指向上一个结点（这是单链表没有的）
    struct DuLNode *prior;
//@s 后继指针：指向下一个结点，尾结点为 NULL
    struct DuLNode *next;
//@s 一次 typedef 出两个名字：DuLNode（结点）和 DuLinkList（指向结点的指针）
} DuLNode, *DuLinkList;
//%end

//%module | 02 | creatNode | creatNode —— 创建新结点 | 1 | 01
//%summary | 申请一块 DuLNode 大小的内存，填好数据域，并把两个指针都置 NULL。
//@d ============ 比单链表多置一个指针 ============
//@d 单链表的新结点只需要 p->next = NULL；
//@d 双向链表必须**两个方向都置 NULL**，否则 prior 就是野指针，
//@d 后面一旦顺着 prior 往回走（比如反向遍历）就会访问到非法内存。
//@d
//@d 这个函数只负责"造出一个孤立的结点"，它还没有被挂到任何链表上，
//@d 所以两个指针都应该是干净的 NULL。

//@s 返回新结点的地址，所以返回类型是 DuLNode *
DuLNode *creatNode(ElemType e)
{
//@s 申请一个结点大小的内存，强制转换成 DuLNode *
//@d 双向结点比单链表结点大一个指针：32 位下 12 字节，64 位下 24 字节
    DuLNode *p = (DuLNode *)malloc(sizeof(DuLNode));

//@s 申请失败必须拦住，否则后面 p->data 就是非法访问
    if (p == NULL)
    {
//@d 打印中文提示，让使用者知道是内存不够，而不是程序莫名其妙退出
        printf("内存分配失败：无法创建新结点。\n");
//@s 申请不到内存属于致命错误，直接结束程序
        exit(OVERFLOW);
    }

//@s 填数据域
    p->data = e;
//@s 前驱置 NULL（单链表没有这一步）
    p->prior = NULL;
//@s 后继置 NULL
//@d 两个方向都干净了，结点才算"造好但还没上链"
    p->next = NULL;

//@s 把新结点的地址返回给调用者
    return p;
}
//%end

//%module | 03 | InitList | InitList —— 初始化带头结点双向链表 | 1 | 01
//%summary | 建立只有头结点的空双向链表：申请头结点，它的两个指针都是 NULL。
//@d ============ 头结点在双向链表里的特殊性 ============
//@d 头结点是"哨兵"：不存有效数据，只为让插入/删除不用特判第一个位置。
//@d 在双向链表里它还有两条铁律：
//@d
//@d   1. 头结点的 prior 永远是 NULL —— 它前面没有结点了；
//@d   2. 头结点的 next 指向第一个数据结点（空表时是 NULL）。
//@d
//@d 空表的样子：
//@d
//@d        ┌────┬──────┬──────┐
//@d        │NULL│  --  │ NULL │
//@d        └────┴──────┴──────┘
//@d          L
//@d
//@d 因为头结点的 prior 是 NULL，"第一个数据结点的 prior 指向头结点"这条关系
//@d 才和中间结点完全一致 —— 这就是后面删除时 p->prior 不用判空的原因。

//@s 参数是 DuLinkList *（二级指针），因为要修改调用者手里的 L 本身
Status InitList(DuLinkList *L)
{
//@s 只申请头结点，不存数据
    *L = (DuLinkList)malloc(sizeof(DuLNode));
//@s 头结点也可能申请失败
    if (*L == NULL) return ERROR;
//@s 头结点的 prior 恒为 NULL，写出来是为了明确这条不变式
    (*L)->prior = NULL;
//@s 空表的标志：头结点的 next 为 NULL
    (*L)->next = NULL;
//@s 返回 OK 表示初始化成功
    return OK;
}
//%end
