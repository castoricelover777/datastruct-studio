#%module | 01 | 头文件与 typedef | 头文件与 typedef 结构体定义 | 1 |
#%summary | 引入标准库，用 typedef 把 struct LNode 包装成好写又好读的类型名。
#@d ============ 为什么要 typedef ============
#@d C 语言里 struct LNode 必须连在一起写，typedef 之后：
#@d     LNode     等价于  struct LNode
#@d     LinkList  等价于  struct LNode *
#@d 从此代码里只出现 LNode / LinkList，可读性大幅提升。
#@d 注意 LinkList 是"指针类型"，所以 LinkList L 本身就是一个指针变量。
#@d
#@d ============ Python 里没有这两样东西 ============
#@d
#@d   1. 没有 typedef，也没有"指针类型"这个概念。
#@d      C 的 LinkList L（指向头结点的指针）在 Python 里就是一个普通变量 L，
#@d      它指向一个 LNode 对象。Python 的变量本来就存的是对象的引用，
#@d      所以"指针"和"对象"在这里是一回事。
#@d
#@d   2. 没有 #include。Python 要用什么直接 import 就行。
#@d      这里实际上一个都不用 import —— 因为不用 malloc、也不用 printf 格式串。
#@d
#@d   3. 没有 #define 宏。状态码直接写成普通常量。

#@s 用常量定义状态码，让函数返回值有意义（比裸 1 / 0 好读）
#@d 约定：函数返回 Status，OK 表示成功，ERROR 表示失败。
OK = 1
#@d C 里 #define 是编译前做文本替换，Python 的常量就是普通变量
ERROR = 0
#@s 布尔值常量，教材习惯写法
TRUE = 1
FALSE = 0
#@d 内存分配失败的专用错误码，取一个和 OK/ERROR 都不冲突的负数
#@d Python 里其实不会"分配失败"，这个常量留着是为了和教材/C 版对齐
OVERFLOW = -2

#@s Status 是函数返回类型；ElemType 是数据域类型
#@d C 里 typedef int ElemType 是为了以后换成 float / char 时只改一行。
#@d Python 是动态类型，本来就不用声明类型，所以这两行只作为说明保留。
Status = int
ElemType = int

#@s 结点：数据域 data + 指针域 next
#@d ============ 内存里长什么样 ============
#@d
#@d   头结点(不存数据)        第 1 个结点          第 2 个结点
#@d   ┌────┬──────┐      ┌────┬──────┐      ┌────┬──────┐
#@d   │ -- │ next │─────▶│ 10 │ next │─────▶│ 20 │ NULL │
#@d   └────┴──────┘      └────┴──────┘      └────┴──────┘
#@d      L                 L.next             带数据的第一颗
#@d
#@d 头结点是"哨兵"：它不存有效数据，只为让插入/删除不用特判第一个位置。
#@d
#@d ============ Python 用 class 表达 struct ============
#@d
#@d   C 的 struct LNode { ElemType data; struct LNode *next; }
#@d   在 Python 里就是一个有两个属性的类。
#@d
#@d   注意 C 里那句 struct LNode *next 不能写成 LNode *next（此时 LNode
#@d   这个名字还没生效）。Python 没这个烦恼，__init__ 里直接写 None 就行。
#@d
#@d   还有一个关键差别：**Python 没有 malloc 和 free**。
#@d   造结点就是 LNode(10)，不用申请内存；不用了也不用管，
#@d   没有任何变量指向它的时候 Python 自己会回收。
class LNode:
#@s 每个结点都要有这两个字段
    def __init__(self, data=None):
#@s 数据域，存具体元素
        self.data = data
#@s 指针域，指向下一个结点；最后一个结点是 None
#@d C 里叫 NULL，Python 里叫 None，含义一样
        self.next = None
#%end

#%module | 02 | creatNode | creatNode —— 创建新节点 | 1 | 01 |
#%summary | 向系统申请一块 LNode 大小的内存，填好数据域和指针域后返回它的地址。
#@d ============ 这个函数是后面所有插入操作的地基 ============
#@d 任何"插入"最终都要先造出一个新结点，思路永远是：
#@d   申请内存 → 填数据 → 指针域置 NULL → 把地址交出去
#@d 内存申请必须检查失败！malloc 失败返回 NULL，直接解引用会崩溃。
#@d
#@d ============ Python 版短得多 ============
#@d
#@d   C 要写 malloc(sizeof(LNode))、强制类型转换、检查返回是不是 NULL、
#@d   再逐字段赋值。Python 一句 LNode(e) 就全干完了：
#@d   构造对象、填 data、把 next 置成 None。
#@d
#@d   所以这里没有"内存分配失败"这条分支 —— Python 分配不出来会直接抛异常，
#@d   不需要我们手动拦住。这不是偷懒，是语言本来就不一样。

#@s 返回新结点；参数 e 是数据
def creatNode(e):
#@s 造一个结点，data 填 e，next 由 __init__ 置成 None
    p = LNode(e)
#@s 把新结点交出去
    return p
#%end

#%module | 03 | InitList | InitList —— 初始化带头结点链表 | 1 | 01 |
#%summary | 建立只有头结点的空表：申请头结点、让它的 next 指向 NULL。
#@d ============ 为什么需要"头结点" ============
#@d 没有头结点时，在第一个位置插入/删除都要单独写一段代码；
#@d 有了头结点，第一个位置和中间位置的操作逻辑完全一样，代码短一半。
#@d
#@d   初始化完成后：   L ──▶ ┌────┬──────┐
#@d                          │ -- │ NULL │
#@d                          └────┴──────┘
#@d
#@d ============ 二级指针怎么办 ============
#@d
#@d   C 的参数是 LinkList *L，因为要修改调用者手里的 L 本身。
#@d   如果写成 LinkList L，函数内改了也传不回去。
#@d
#@d   Python 里对象是按引用传的，但"给变量重新赋值"这件事传不出去。
#@d   要表达"初始化一张表"这个动作，最自然的写法是**直接返回新建的头结点**：
#@d
#@d       L = InitList()
#@d
#@d   调用者拿返回值赋给 L，效果和 C 的 InitList(&L) 完全一样，
#@d   而且比二级指针好懂得多 —— 这是 Python 更顺手的地方。
#@d
#@d   （后面 freeList 那里会用另一种办法：把 L 装进一个列表当"盒子"，
#@d     因为那个函数必须把调用者的 L 置成 None。到时再细说。）

#@s 返回新建的头结点
def InitList():
#@s 只申请头结点，不存数据（data 留空）
    head = LNode()
#@s 空表的标志：头结点的 next 为 None
    head.next = None
#@s 把头结点交出去
    return head
#%end

#%module | 04 | applist | applist —— 尾部追加节点 | 2 | 01,02,03 |
#%summary | 顺着 next 一路走到最后一个结点，把新结点挂到它后面。
#@d ============ 指针推进过程 ============
#@d 目标：在尾部追加 30
#@d
#@d  初始：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
#@d          p
#@d
#@d  循环：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
#@d                              p        （p->next != NULL，继续走）
#@d
#@d  停止：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
#@d                                     p   （p->next == NULL，p 就是尾结点）
#@d
#@d  挂上：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
#@d 关键：p 从头结点起步，不是从 L->next 起步 —— 这样空表也能正确处理。
#@d
#@d ============ 和 C 只有符号上的差别 ============
#@d
#@d   p->next  变成  p.next
#@d   != NULL  变成  is not None
#@d   参数不用清空一层的指针 —— 这个函数不改 L 本身，只改 L 指向的那串，
#@d   所以 Python 里传 L 就行，不存在"传值还是传地址"的问题。

#@s 参数 head 是头结点；返回值表示成功与否
#@d 注意这里没改 head 本身，改的是 head 后面那串，所以不需要"盒子"
def applist(head, e):
#@s p 是"游标"，从头结点开始；它最终会停在尾结点上
    p = head
#@s 防御：head 为空说明没初始化过，直接报错
    if head is None:
        return ERROR

#@s 一路向后走，直到 p 后面没有结点了
#@d 循环条件是 p.next != None，看的永远是"下一个"，所以停下时 p 正是尾结点
    while p.next is not None:
#@s 指针后移一格
        p = p.next

#@s 造新结点
    s = creatNode(e)

#@s 把新结点接到尾结点后面，链表就延长了一节
#@d 只需要改一处指针；原来的尾结点 next 从 None 变成指向 s
    p.next = s

#@s 返回 OK 表示追加成功
    return OK
#%end

#%module | 05 | HeadInsert | HeadInsert —— 头插法插入节点 | 1 | 01,02 |
#%summary | 把新结点直接挂到头结点后面，成为新的第一个结点，完全不需要遍历。
#@d ============ 头插法 vs 尾插法 ============
#@d
#@d   applist（尾插）  ：从头一路走到尾，找到尾结点再挂上    —— 时间复杂度 O(n)
#@d   HeadInsert（头插）：直接插在头结点后面，碰都不碰其他结点 —— 时间复杂度 O(1)
#@d
#@d 代价是头插会**颠倒顺序**：依次头插 10、20、30，得到的是 30 -> 20 -> 10。
#@d 这不是缺陷，恰恰是头插法最常用的一个特性 —— "头插法建表"就是靠它做逆序的：
#@d
#@d     L = InitList()
#@d     for x in a:
#@d         HeadInsert(L, x)          # 建出来的表正好是数组 a 的逆序
#@d
#@d 再记住一个等价关系：HeadInsert(L, e) 和 ListInsert(L, 1, e) 干的是同一件事，
#@d 前者只是把"找第 0 个结点"这一步省掉了 —— 因为头结点本身就是第 0 个。
#@d
#@d ============ 两步指针操作，顺序不能反 ============
#@d 目标：把 5 头插进 10 -> 20 -> 30
#@d
#@d  插入前：   L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
#@d
#@d  第一步（新结点先接住原来的头一个）：s->next = L->next
#@d            L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
#@d                          ▲
#@d            [5] ──────────┘
#@d             s
#@d
#@d  第二步（头结点再指向新结点）：L->next = s
#@d            L ─▶ [头] ─▶ [5] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
#@d                          s
#@d
#@d 头结点 [头] 本身始终待在原地，头插法动的只是它的 next 指针。
#@d
#@d ============ 顺序反了会怎样 ============
#@d C 里写反了会内存泄漏（原来第一个结点的地址丢了）。
#@d Python 里写反了不会泄漏（没人引用就自动回收），但链表的形状还是错的：
#@d s.next 会指向 s 自己，链表出现环，遍历时死循环。
#@d 所以这个顺序在 Python 里同样不能写反。

#@s 参数 head 是头结点；位置固定第 1 位，所以不需要 i
def HeadInsert(head, e):
#@s 防御：head 为空说明没初始化过，直接报错
    if head is None:
        return ERROR

#@s 造新结点
    s = creatNode(e)

#@s 第一步：新结点先接住原来头结点后面的那一串
#@d 做完这一步，链表本身还是完整的，只是多了一个"悬挂"在外面的 s
    s.next = head.next
#@s 第二步：头结点再指向新结点，s 正式成为第 1 个结点
    head.next = s

#@s 插入成功
    return OK
#%end

#%module | 06 | GetElem_L | GetElem_L —— 按位查找 | 2 | 01,03 |
#%summary | 从头结点的下一个出发数到第 i 个结点，把它的数据域取出来。
#@d ============ 找第 3 个结点（i = 3）============
#@d
#@d   L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ [30] ─▶ NULL
#@d          j=1     j=2     j=3
#@d           p       p       p
#@d
#@d  循环结束时 j == i，p 正好停在第 i 个结点上。
#@d 两个必须同时检查的失败情况：
#@d   p == NULL  → i 比表长还大，数着数着掉出去了
#@d   j > i      → i 小于 1（比如 i = 0），循环一次都没进
#@d
#@d ============ 出口参数 e 怎么办 ============
#@d
#@d   C 里第三个参数是 ElemType *e，一个"出口参数" ——
#@d   函数没法返回两个值，只能把数据通过指针写回调用者。
#@d
#@d   Python 可以直接 return OK, value，调用者写
#@d       r, v = L.GetElem_L(3)
#@d   同时拿到状态和值。失败时第二个值给 None。

#@s 返回 (状态, 第 i 个元素的值)；失败时值是 None
def GetElem_L(head, i):
#@s 从第 1 个"带数据的结点"开始，所以是 head.next 而不是 head
#@d 头结点不存数据，跳过它 —— 这是带头结点链表里最常见的起点写法
    p = head.next
#@s 计数器 j 与 p 同步，表示"p 现在指的是第几个结点"
    j = 1

#@s 边走边数，直到数到 i 或者走到表尾
#@d p is not None 写在前面，靠短路求值保证不会对 None 取 .next
    while p is not None and j < i:
#@s 指针后移
        p = p.next
#@s 计数器同步加一
        j += 1

#@s 越界检查：p 为空说明 i 超过表长；j > i 说明 i 小于 1
    if p is None or j > i:
        return ERROR, None

#@s 查找成功，把值一起交出去
    return OK, p.data
#%end

#%module | 07 | LocateElem | LocateElem —— 按值查找 | 2 | 01,03 |
#%summary | 从头到尾逐个比较数据域，返回第一个值相等的结点的地址。
#@d ============ 按值查找和按位查找的区别 ============
#@d 按位查找：数位置，返回"值"
#@d 按值查找：比值，返回"结点地址"
#@d
#@d 为什么返回地址而不是值？因为拿回地址后，调用者还能继续访问
#@d p->next 等后继信息，也可以在它前面做插入删除。
#@d
#@d 找不到时返回 NULL —— C 语言里表示"没有这个结点"的标准做法。
#@d Python 里对应的是返回 None，判断写成 `if p is None`。

#@s 返回结点本身，找不到就是 None
def LocateElem(head, e):
#@s 同样从第一个带数据的结点开始
    p = head.next

#@s 两个条件：还没走到尾，且当前值不等于目标
#@d 一旦 p.data == e，循环立刻停下，p 就停在第一个匹配的结点上
    while p is not None and p.data != e:
#@s 不匹配就继续往后
        p = p.next

#@s 找到返回结点，没找到时 p 已经是 None，直接返回即可
    return p
#%end

#%module | 08 | ListInsert | ListInsert —— 按位插入 | 3 | 01,02,03 |
#%summary | 先找第 i-1 个结点 p，再造新结点 s，把 s 插到 p 的后面。
#@d ============ 插入的核心：两句指针赋值不能写反 ============
#@d 目标：在第 2 个位置插入 15
#@d
#@d  插入前：  L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
#@d                       p
#@d
#@d  第一步（先接后面）：s->next = p->next
#@d          [15] ─────▶ [20]
#@d            s           ▲
#@d                        └── 此时 p->next 还指着 [20]
#@d
#@d  第二步（再断前面）：p->next = s
#@d          [10] ─▶ [15] ─▶ [20]
#@d            p       s
#@d
#@d 如果两句写反，C 里 [20] 的地址就丢了（内存泄漏），而且 s->next 会指向 s
#@d 自己，链表出现环 —— 这是最经典的踩坑点。Python 里不会泄漏，但环照样会出现。
#@d
#@d 还有一条铁律：先判断能不能插，再造结点。顺序颠倒会导致插入失败时
#@d 白白多出一个没挂上链表的"孤儿结点"。

#@s 参数 head 是头结点；i 是位置（从 1 开始），e 是数据
def ListInsert(head, i, e):
#@s p 要从头结点开始：因为插到第 1 位时，前驱就是头结点
#@d 这正是头结点的价值 —— 第 1 位和后面位置走同一段逻辑
    p = head
#@s j 表示 p 当前指向第几个结点；头结点算第 0 个
    j = 0

#@s 走 i-1 步，让 p 停在"第 i 个结点的前驱"上
#@d 循环条件 j < i - 1：i = 1 时一次也不进循环，p 直接就是头结点
    while p is not None and j < i - 1:
#@s 指针后移
        p = p.next
#@s 计数器同步
        j += 1

#@s 合法性检查：p 为空说明 i-1 已经超过表长；j > i-1 说明 i < 1
#@d 注意这里是先检查后造结点，避免产生孤儿结点
    if p is None or j > i - 1:
        return ERROR

#@s 造新结点
    s = creatNode(e)

#@s 第一步：新结点先接住后面的那一串（顺序不能反！）
    s.next = p.next
#@s 第二步：前驱再指向新结点，链表正式接上
    p.next = s

#@s 返回 OK 表示插入成功
    return OK
#%end

#%module | 09 | ListDelete | ListDelete —— 按位删除 | 3 | 01,03 |
#%summary | 先找第 i-1 个结点 p，摘下 p 后面的结点 q，取出数据后释放 q。
#@d ============ 删除的三步 ============
#@d 目标：删除第 2 个结点（值为 15）
#@d
#@d  删除前：  L ─▶ [头] ─▶ [10] ─▶ [15] ─▶ [20] ─▶ NULL
#@d                       p        q
#@d
#@d  摘链：    p->next = q->next    把 [20] 的地址交给 p
#@d           L ─▶ [头] ─▶ [10] ─▶ [20] ─▶ NULL
#@d                       p        q（已被绕开，但还占着内存）
#@d
#@d  释放：    free(q)             把结点还给系统，q 变野指针
#@d
#@d 顺序要点：一定要先把 q->data 存进 *e，再 free(q)；
#@d 一旦 free 之后再去读 q->data 就是"释放后使用"，属于未定义行为。
#@d 另外 free 之后建议把 q 置 NULL，防止后续误用。
#@d
#@d ============ Python 里没有 free ============
#@d
#@d   摘链只做一步：p.next = q.next。
#@d   不需要 free(q) —— 当没有任何变量指向 q 时，Python 自己会回收它。
#@d
#@d   但"先取数据再摘链"这个顺序**还是要保持**：写反了虽然不会崩溃，
#@d   但读起来会和 C 版对不上，复习的时候容易混。

#@s 返回 (状态, 被删掉的元素)；失败时值是 None
def ListDelete(head, i):
#@s p 从头结点起步，最终停在第 i-1 个结点
    p = head
#@s j 记录 p 的位置，头结点记为 0
    j = 0

#@s 走 i-1 步定位前驱
#@d 这里用 p.next != None 作为条件：确保 p 后面确实有一个结点可以摘
    while p.next is not None and j < i - 1:
#@s 指针后移
        p = p.next
#@s 计数器同步
        j += 1

#@s 越界检查：p.next 为空说明第 i 个结点不存在
    if p.next is None or j > i - 1:
        return ERROR, None

#@s 用 q 记住待删结点
    q = p.next
#@s 先把数据取出来交给调用者（顺序上和 C 版一致）
    e = q.data
#@s 摘链：前驱直接跨过 q，指向 q 的后继
    p.next = q.next
#@d 这里原本是 free(q)。Python 不用写 —— q 没人引用后就自动回收了。

#@s 删除成功，把被删的值一起交出去
    return OK, e
#%end

#%module | 10 | printList | printList —— 打印链表 | 1 | 01 |
#%summary | 从头到尾走一遍，把每个结点的数据打出来，最后打一个 NULL 收尾。
#@d ============ 遍历的固定套路 ============
#@d
#@d   p = L->next;              ← 跳过不存数据的头结点
#@d   while (p != NULL) {       ← 走到 NULL 说明到尾了
#@d       ... 处理 p->data ...
#@d       p = p->next;          ← 千万别忘了这一句，否则死循环
#@d   }
#@d
#@d 输出格式 10 -> 20 -> 30 -> NULL，最后那个 NULL 是"链尾"的可视化，
#@d 方便一眼看出链表在哪里结束。
#@d
#@d ============ Python 的 print 更好用 ============
#@d
#@d   C 逐个 printf("%d -> ") 拼出来，还要单独收尾打 "NULL\n"。
#@d   Python 先把所有值收集到列表里，再用一个 join 拼成字符串打印，
#@d   中间不用管逗号也不用管换行（print 自己会换行）。
#@d
#@d   但输出内容保持和 C 版一模一样：10 -> 20 -> 30 -> NULL

#@s 只读操作，不需要修改链表
def printList(head):
#@s 从第一个真实结点开始
    p = head.next

#@s 空表单独处理，提示比"什么都不打印"清楚得多
    if p is None:
#@s 空表提示
        print('(空表)')
#@s 直接返回，不再进入循环
        return

#@s 标准遍历：先收集所有元素
    parts = []
    while p is not None:
#@s 把当前数据装进列表
        parts.append(str(p.data))
#@s 推进到下一个结点
        p = p.next

#@s 用 " -> " 连接，最后补一个 NULL 标明链表末端
    print(' -> '.join(parts) + ' -> NULL')
#%end

#%module | 11 | freeList | freeList —— 释放内存 | 2 | 01,03 |
#@d ============ 为什么必须先保存 next ============
#@d
#@d  错误写法：                正确写法：
#@d    free(p);                  q = p;
#@d    p = p->next;   ← 危险!    p = p->next;
#@d                             free(q);
#@d
#@d free(p) 之后那块内存已经还给系统，p->next 读到的是垃圾值，
#@d 用这个垃圾值当地址去访问就是"释放后使用"（use after free）。
#@d 所以要先记住后继，再释放当前。
#@d
#@d ============ Python 版只剩"断链"这一件事 ============
#@d
#@d   没有 free 可调，要做的是**把所有引用断开**，
#@d   让整条链上再没有变量指向它，Python 就会自动回收。
#@d
#@d   具体做法：从头结点开始，一个一个把 next 置成 None。
#@d   这样每条结点都不再被前一个引用，整条链就散开了。
#@d
#@d ============ 那"把 L 置成 NULL"怎么写？============
#@d
#@d   C 的参数是 LinkList *L，最后要写 *L = NULL 把调用者的指针清掉。
#@d   Python 里给参数重新赋值**传不出去**（只是换了个局部名字指的东西）。
#@d
#@d   所以这里用一个"盒子"：把 L 装进一个只有一个元素的列表。
#@d       box = [head]
#@d       freeList(box)
#@d       print(box[0])      # 里面已经是 None 了
#@d
#@d   改 box[0] 就是改盒子里的东西，调用者看得见 ——
#@d   这正好对应 C 的 *L = NULL，也是 Python 里表达"我要改你手里那个变量"
#@d   最常见的手法。
#%summary | 逐个释放每个结点，最后把头结点也释放掉，并把指针置 NULL。

#@s 参数 box 是 [head] 这样的单元素列表，用来把 L 本身置空
def freeList(box):
#@s 从第一个真实结点开始清理
    p = box[0].next

#@s 逐个结点断开
    while p is not None:
#@s 先记住下一个
#@d C 这里是 q = p; p = p->next; free(q)，Python 只需要前两步
        nxt = p.next
#@s 把当前结点的 next 断掉，它就不再引用后面的结点了
        p.next = None
#@s p 走到下一个
        p = nxt

#@s 数据结点都清完了，头结点也断开
    box[0].next = None
#@s 把盒子里的 L 置成 None，调用者那边看到的也是 None
#@d 这一步对应 C 的 *L = NULL
    box[0] = None
#%end

#%module | 12 | main | main —— 主函数测试 | 2 | 01,02,03,04,05,06,07,08,09,10,11 |
#%summary | 把 9 个基本操作串起来跑一遍，用输出验证每一步的结果是否符合预期。
#@d ============ 测试程序的编排思路 ============
#@d 千万不要一次性把所有操作写完再运行，那样出错无从下手。
#@d 正确做法是"一步一打印"：每做完一个操作就 printList，
#@d 让输出自己告诉你哪一步开始不对。
#@d
#@d 另外一定要测三种边界：
#@d   1. 空表      （初始化后立刻打印）
#@d   2. 越界位置  （插入/查找/删除一个不存在的位置，应返回 ERROR）
#@d   3. 空表释放  （防止 freeList 对空表崩溃）
#@d
#@d ============ 和 C 版的写法差别 ============
#@d
#@d   1. 出口参数不见了：GetElem_L 和 ListDelete 都改成
#@d      `r, e = L.GetElem_L(3)` 这样一次接两个返回值。
#@d
#@d   2. 三元表达式顺序相反：
#@d      C 的 `cond ? "成功" : "失败"`
#@d      Python 写成 `"成功" if cond else "失败"` —— 条件在中间。
#@d
#@d   3. freeList 要传"盒子" [L]，因为要把 L 本身置成 None。

#@s 主函数：Python 用 if __name__ 的固定写法代替 C 的 main
if __name__ == '__main__':
#@s L 是头结点，由 InitList 创建
    L = None

#@s ========== 第 1 步：初始化 ==========
    print('========== 1. 初始化 ==========')
#@s 初始化；Python 版不会失败，但保留判断是为了和 C 版结构一致
    L = InitList()
    if L is None:
#@s 失败提示
        print('初始化失败！')
#@s 直接结束
        raise SystemExit(ERROR)
#@s 打印验证：此时应该是空表
    print('初始化完成，当前链表：', end='')
    printList(L)

#@s ========== 第 2 步：尾部追加 ==========
    print()
    print('========== 2. 尾部追加 10 20 30 ==========')
#@s 依次追加三个数
    applist(L, 10)
    applist(L, 20)
    applist(L, 30)
#@s 期望输出：10 -> 20 -> 30 -> NULL
    print('追加后：', end='')
    printList(L)

#@s ========== 第 3 步：头插法 ==========
    print()
    print('========== 3. 头插法插入 ==========')
#@s 头插 5：不遍历，直接变成第 1 个结点
    HeadInsert(L, 5)
#@s 期望输出：5 -> 10 -> 20 -> 30 -> NULL
    print('头插后：', end='')
    printList(L)

#@s 再头插 3，亲眼看一次"头插会颠倒顺序"
    HeadInsert(L, 3)
#@s 期望输出：3 -> 5 -> 10 -> 20 -> 30 -> NULL
#@d 头插法建出来的表天生是逆序的，所以"头插法建表"常被拿来倒序一个数组
    print('再头插 3 后：', end='')
    printList(L)

#@s ========== 第 4 步：按位插入 ==========
    print()
    print('========== 4. 在第 2 位插入 15 ==========')
#@s 插到第 2 个位置，即 3 和 5 之间
    ListInsert(L, 2, 15)
#@s 期望输出：3 -> 15 -> 5 -> 10 -> 20 -> 30 -> NULL
    print('插入后：', end='')
    printList(L)

#@s 越界测试：在第 99 位插入必须失败
#@d 注意这里写成一条 f-string，没有写成 print(a, b)。
#@d 因为 Python 的 print 传多个参数时会用一个空格隔开，
#@d 而 C 的 printf 是精确拼接、不加多余空格 —— 对照输出时就会差一格。
    print(f'在第 99 位插入 5 ：{"成功" if ListInsert(L, 99, 5) == OK else "失败（越界，符合预期）"}')

#@s ========== 第 5 步：按位查找 ==========
    print()
    print('========== 5. 按位查找 ==========')
#@s 查第 3 个元素
#@d 此时链表是 3 -> 15 -> 5 -> 10 -> 20 -> 30，第 3 个是 5
    r, e = GetElem_L(L, 3)
    if r == OK:
#@s 期望输出：5
        print(f'第 3 个元素的值是 {e}')
#@s 越界查找测试
    r, e = GetElem_L(L, 100)
    if r == ERROR:
#@s 期望走到这里
        print('查第 100 个元素失败（越界，符合预期）')

#@s ========== 第 6 步：按值查找 ==========
    print()
    print('========== 6. 按值查找 ==========')
#@s 找值为 20 的结点
    p = LocateElem(L, 20)
#@s 找到就打印它的后继信息
    if p is not None:
#@s p.next 非空则说明 20 不是尾结点
        print(f'找到值为 20 的结点，它的后继是 {"一个有效结点" if p.next is not None else "NULL"}')
#@s 找不存在的值应当返回 None
    if LocateElem(L, 99) is None:
#@s 期望走到这里
        print('查找值 99 返回 NULL（符合预期）')

#@s ========== 第 7 步：按位删除 ==========
    print()
    print('========== 7. 删除第 1 个结点 ==========')
#@s 删除第 1 个结点，被删的值一起返回
    r, e = ListDelete(L, 1)
    if r == OK:
#@s 期望输出：被删除的是 3
        print(f'已删除第 1 个结点，它的值是 {e}')
#@s 期望输出：15 -> 5 -> 10 -> 20 -> 30 -> NULL
    print('删除后：', end='')
    printList(L)

#@s 越界删除测试
    r, _ = ListDelete(L, 10)
    print(f'删除第 10 个结点：{"成功" if r == OK else "失败（越界，符合预期）"}')

#@s ========== 第 8 步：释放整表 ==========
    print()
    print('========== 8. 释放内存 ==========')
#@s 释放所有结点。Python 版要传"盒子"，因为它把盒子里的 L 置成 None
    box = [L]
    freeList(box)
#@s 期望输出：NULL，证明 L 已被正确置空
    print('释放完成，L =', 'NULL' if box[0] is None else '非 NULL')
#%end
