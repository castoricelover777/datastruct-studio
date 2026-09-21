#%module | 01 | 头文件与 typedef | 头文件与 typedef 双向结点结构体 | 1 |
#%summary | 引入标准库，把双向结点 struct DuLNode 包装成 DuLNode / DuLinkList。
#@d ============ 相比单链表，结构体里多了什么 ============
#@d
#@d   单链表：  typedef struct LNode  { ElemType data; struct LNode  *next;  } LNode,  *LinkList;
#@d   双向链表：typedef struct DuLNode { ElemType data; struct DuLNode *prior;
#@d                                                     struct DuLNode *next;  } DuLNode, *DuLinkList;
#@d
#@d 就多了一个 prior。命名上习惯用 Du 前缀（double）把两者区分开 ——
#@d 一份代码里同时出现单链表和双向链表时，这个前缀能救命。
#@d
#@d ============ 内存里长什么样 ============
#@d
#@d   [头] ⇄ [10] ⇄ [20] ⇄ [30]
#@d    L
#@d
#@d 屏幕上每个 ⇄ 在内存里其实是**两根方向相反**的指针。
#@d 把每个结点的两个指针摊开列出来：
#@d
#@d   [头]：prior = NULL、next = [10]
#@d   [10]：prior = [头]、next = [20]
#@d   [20]：prior = [10]、next = [30]
#@d   [30]：prior = [20]、next = NULL
#@d
#@d 只有头结点的 prior 是 NULL（它前面没有结点了），
#@d 只有尾结点的 next 是 NULL（它后面没有结点了）。
#@d 这两条性质后面写插入、删除时会反复用到 —— 尤其是"要不要判空"。
#@d
#@d ============ Python 里这些怎么表达 ============
#@d
#@d   struct DuLNode → class DuLNode，三个字段变成三个属性。
#@d   没有 typedef、没有 #include、没有 #define，原因和单链表那节一样。
#@d   最要紧的一点还是那句：**Python 没有 malloc 和 free**，
#@d   造结点直接 DuLNode(e)，不用了也不用管，没人引用就会自动回收。

#@s 用常量定义状态码，让函数返回值有意义（比裸 1 / 0 好读）
#@d 约定：函数返回 Status，OK 表示成功，ERROR 表示失败
OK = 1
ERROR = 0
TRUE = 1
FALSE = 0
#@d 内存分配失败的专用错误码。Python 里不会"分配失败"，留着是为了和教材对齐
OVERFLOW = -2

#@s Status 是函数返回类型；ElemType 是数据域类型
Status = int
ElemType = int

#@s 双向结点：数据域 + 前驱指针 + 后继指针
#@d 两个指针的分工：
#@d   prior  指向前一个结点，头结点的 prior 是 None
#@d   next   指向后一个结点，最后一个结点的 next 是 None
#@d
#@d 有一条贯穿全书的等式，插入删除时全靠它自检：
#@d
#@d     p->next->prior == p        以及        p->prior->next == p
#@d
#@d 也就是"我指向谁，谁就得指回我"。写双向链表的代码时，每改一次指针
#@d 都拿这句话对一遍，基本不会错。
#@d
#@d Python 里写成 p.next.prior == p，判断空的那一侧要写成
#@d p.next is not None 再去访问 .prior，否则会抛 AttributeError。
class DuLNode:
#@s 造结点时把数据、前驱、后继三个字段一次填好
    def __init__(self, data=None):
#@s 数据域，存具体元素
        self.data = data
#@s 前驱指针：指向上一个结点（这是单链表没有的）
        self.prior = None
#@s 后继指针：指向下一个结点，尾结点为 None
        self.next = None
#%end

#%module | 02 | creatNode | creatNode —— 创建新结点 | 1 | 01 |
#%summary | 申请一块 DuLNode 大小的内存，填好数据域，并把两个指针都置 NULL。
#@d ============ 比单链表多置一个指针 ============
#@d 单链表的新结点只需要 p->next = NULL；
#@d 双向链表必须**两个方向都置 NULL**，否则 prior 就是野指针，
#@d 后面一旦顺着 prior 往回走（比如反向遍历）就会访问到非法内存。
#@d
#@d 这个函数只负责"造出一个孤立的结点"，它还没有被挂到任何链表上，
#@d 所以两个指针都应该是干净的 NULL。
#@d
#@d ============ Python 版一行顶 C 的四句 ============
#@d
#@d   C 要 malloc、检查失败、填 data、置 prior、置 next，五件事。
#@d   Python 一句 DuLNode(e)：构造函数把 data 填好，prior 和 next
#@d   在 __init__ 里已经置成 None 了。
#@d   所以这里没有"内存分配失败"这条分支 —— Python 分不出来会直接抛异常。

#@s 返回新结点；参数 e 是数据
def creatNode(e):
#@s 造一个孤立结点：data 填 e，两个指针都是 None
    p = DuLNode(e)
#@s 把新结点交出去
    return p
#%end

#%module | 03 | InitList | InitList —— 初始化带头结点双向链表 | 1 | 01 |
#%summary | 建立只有头结点的空双向链表：申请头结点，它的两个指针都是 NULL。
#@d ============ 头结点在双向链表里的特殊性 ============
#@d 头结点是"哨兵"：不存有效数据，只为让插入/删除不用特判第一个位置。
#@d 在双向链表里它还有两条铁律：
#@d
#@d   1. 头结点的 prior 永远是 NULL —— 它前面没有结点了；
#@d   2. 头结点的 next 指向第一个数据结点（空表时是 NULL）。
#@d
#@d 空表的样子：
#@d
#@d        ┌────┬──────┬──────┐
#@d        │NULL│  --  │ NULL │
#@d        └────┴──────┴──────┘
#@d          L
#@d
#@d 因为头结点的 prior 是 NULL，"第一个数据结点的 prior 指向头结点"这条关系
#@d 才和中间结点完全一致 —— 这就是后面删除时 p->prior 不用判空的原因。
#@d
#@d ============ 二级指针怎么翻 ============
#@d   C 的参数是 DuLinkList *L，因为要修改调用者手里的 L 本身。
#@d   Python 里最自然的写法是**直接返回新建的头结点**：
#@d       L = InitList()
#@d   效果和 InitList(&L) 一样，而且好懂得多。

#@s 返回新建的头结点
def InitList():
#@s 只申请头结点，不存数据
    head = DuLNode()
#@s 头结点的 prior 恒为 None，写出来是为了明确这条不变式
    head.prior = None
#@s 空表的标志：头结点的 next 为 None
    head.next = None
#@s 把头结点交出去
    return head
#%end

#%module | 04 | applist | applist —— 尾部追加节点 | 2 | 01,02,03 |
#%summary | 顺着 next 走到最后一个结点，把新结点接到它后面，并补上 prior 方向。
#@d ============ 双向链表比单链表多改一根指针 ============
#@d 单链表尾插只有一步：p->next = s;
#@d 双向链表要做两步，而且两步都要做：
#@d
#@d     s->prior = p;      ← 新结点回指旧的尾结点
#@d     p->next  = s;      ← 旧尾结点指向新结点
#@d
#@d 少了第一句，整条链表从后往前就断了：正向遍历看不出来，一旦反向遍历
#@d （或者删除尾结点时用 p->prior）就会踩到野指针。
#@d
#@d ============ 指针推进过程 ============
#@d 目标：在尾部追加 30
#@d
#@d  初始：  L ─▶ [头] ⇄ [10] ⇄ [20]
#@d          p
#@d
#@d  循环：  L ─▶ [头] ⇄ [10] ⇄ [20]
#@d                              p        （p->next == NULL，p 就是尾结点）
#@d
#@d  挂链：  L ─▶ [头] ⇄ [10] ⇄ [20] ⇄ [30]
#@d 注意 [20] 和 [30] 之间是**双向**的箭头，两根指针缺一不可。

#@s 参数 head 是头结点；这个函数不改 head 本身，所以不需要"盒子"
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

#@s 造新结点（此时它的 prior 和 next 都是 None）
    s = creatNode(e)

#@s 第一步：新结点的 prior 回指旧的尾结点
#@d 这一句是双向链表特有的，单链表尾插没有
    s.prior = p
#@s 第二步：旧尾结点的 next 指向新结点
#@d 两句都做完，[p] ⇄ [s] 这条双向关系才成立
    p.next = s

#@s 返回 OK 表示追加成功
    return OK
#%end

#%module | 05 | HeadInsert | HeadInsert —— 头插法插入节点 | 2 | 01,02,03 |
#%summary | 把新结点挂到头结点后面成为第一个结点；双向链表要特判空表。
#@d ============ 头插法的特点 ============
#@d
#@d   applist（尾插）  ：从头一路走到尾             —— 时间复杂度 O(n)
#@d   HeadInsert（头插）：直接插在头结点后面        —— 时间复杂度 O(1)
#@d
#@d 代价是头插会**颠倒顺序**：依次头插 10、20、30，得到的是 30 ⇄ 20 ⇄ 10。
#@d 这不是缺陷 —— "头插法建表"正是靠它做逆序的。
#@d
#@d 再记住一个等价关系：HeadInsert(L, e) 和 ListInsert(L, 1, e) 干的是同一件事。
#@d
#@d ============ 双向链表的头插为什么必须判空表 ============
#@d 单链表头插只有两句，不用管表是不是空的：
#@d
#@d     s->next = L->next;
#@d     L->next = s;
#@d
#@d 双向链表要处理的指针多一根，而且有一句**在空表时是非法操作**：
#@d
#@d     s->next = L->next;
#@d     if (s->next != NULL)  s->next->prior = s;    ← 必须判空！
#@d     s->prior = L;
#@d     L->next = s;
#@d
#@d 空表时 L->next 是 NULL，如果不判空就去写 s->next->prior，
#@d 等于对空指针取成员 —— 程序当场崩溃。这是双向链表头插最经典的坑。
#@d
#@d Python 里后果不一样但同样要判：不判的话 s.next 是 None，
#@d 再去取 s.next.prior 会抛 AttributeError，程序照样中断。
#@d
#@d ============ 插入前后 ============
#@d 把 5 头插进 10 ⇄ 20
#@d
#@d  插入前：  L ─▶ [头] ⇄ [10] ⇄ [20]
#@d
#@d  四步做完：
#@d           L ─▶ [头] ⇄ [5] ⇄ [10] ⇄ [20]
#@d
#@d 其中 [5] 与 [头]、[5] 与 [10] 之间都要是双向的。

#@s 参数 head 是头结点；位置固定在第 1 位，所以不需要 i
def HeadInsert(head, e):
#@s 防御：head 为空说明没初始化过
    if head is None:
        return ERROR

#@s 造新结点
    s = creatNode(e)

#@s 第一步：新结点的 next 接住原来头结点后面的那一串
    s.next = head.next
#@s 第二步：如果后面确实有结点，让它的 prior 改指新结点
#@d 这一步必须判空：空表时 head.next 是 None，s.next.prior 会抛 AttributeError
    if s.next is not None:
        s.next.prior = s
#@s 第三步：新结点的 prior 指向头结点
#@d 头结点一定存在，所以这一句不需要判空
    s.prior = head
#@s 第四步：头结点指向新结点，s 正式成为第 1 个结点
    head.next = s

#@s 插入成功
    return OK
#%end

#%module | 06 | GetElem_L | GetElem_L —— 按位查找 | 2 | 01,03 |
#%summary | 从头结点的下一个出发数到第 i 个结点，把它的数据域取出来。
#@d ============ 这段代码和单链表完全一样 ============
#@d 按位查找只需要沿 next 往后走，"双向"在这里帮不上忙
#@d —— 除非你想从尾部倒着数，但那需要先知道表长，通常不划算。
#@d （进阶：有的实现会额外记录 length，那样 i 大于一半时可以从尾结点
#@d   顺着 prior 往前找，代价是每次插入删除都要维护 length。本教材从简。）
#@d
#@d ============ 找第 3 个结点（i = 3）============
#@d
#@d   L ─▶ [头] ⇄ [10] ⇄ [20] ⇄ [30]
#@d          j=1     j=2     j=3
#@d           p       p       p
#@d
#@d 两个必须同时检查的失败情况：
#@d   p == NULL  → i 比表长还大，数着数着掉出去了
#@d   j > i      → i 小于 1（比如 i = 0），循环一次都没进
#@d
#@d ============ 出口参数 e 改成返回值 ============
#@d C 里第三个参数 ElemType *e 是出口参数，因为函数只能返回一个值。
#@d Python 直接 return OK, p.data，调用者写 r, v = L.GetElem_L(3) 一次接两个。

#@s 返回 (状态, 第 i 个元素的值)；失败时值是 None
def GetElem_L(head, i):
#@s 从第 1 个"带数据的结点"开始，所以是 head.next 而不是 head
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
#@d ============ 按值查找返回的是"结点"不是"值" ============
#@d 拿回结点地址后，调用者还能继续访问它的 prior / next，
#@d 也能在它前后做插入删除 —— 这比只拿回一个数据值有用得多。
#@d
#@d 找不到时返回 NULL，这是 C 语言表示"没有这个结点"的标准做法。
#@d
#@d 双向链表在这里同样没有优势（按值查找本身就是逐个比对），
#@d 除非链表是按别的规则组织过的。
#@d
#@d Python 里返回 None 表示没找到，判断写 `if p is None`。

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

#%module | 08 | ModifyElem | ModifyElem —— 按位修改 | 2 | 01,03 |
#%summary | 定位到第 i 个结点，把它的数据域改成新值 —— 也就是"查改"里的"改"。
#@d ============ 改和查是一对 ============
#@d 把 ModifyElem 和 GetElem_L 摆在一起看，会发现它们**只差最后一句**：
#@d
#@d     GetElem_L ：  *e = p->data;     把结点里的值读出来
#@d     ModifyElem ：  p->data = e;     把新值写进结点
#@d
#@d 前面"走 i-1 步定位"的循环、以及越界检查，两者一模一样。
#@d 这也说明一件事：**定位是链表操作里最通用的部分**，
#@d 插入、删除、查找、修改都要先定位，区别只在定位到第几个结点、
#@d 以及定位之后动几根指针。
#@d
#@d ============ 修改只动数据域，不动指针 ============
#@d 这一点很重要：改一个结点的值不会改变链表的形状，
#@d 所以不需要碰 prior / next，也就不会有双向链表那些"漏改一根指针"的风险。
#@d
#@d 代价是修改**不能改变链表的顺序**。如果你要的是"把某个值挪到前面"，
#@d 那得先删除再插入，属于删+插的组合操作。

#@s 要改的目标值通过 e 传进来（按值传递就够了）
def ModifyElem(head, i, e):
#@s 从第 1 个"带数据的结点"开始
    p = head.next
#@s 计数器 j 与 p 同步
    j = 1

#@s 定位到第 i 个结点（与 GetElem_L 的循环完全相同）
    while p is not None and j < i:
#@s 指针后移
        p = p.next
#@s 计数器同步
        j += 1

#@s 越界检查：第 i 个结点不存在就报错
    if p is None or j > i:
        return ERROR

#@s 把新值写进数据域 —— 只改数据，不碰任何指针
    p.data = e

#@s 修改成功
    return OK
#%end

#%module | 09 | ListInsert | ListInsert —— 按位插入 | 3 | 01,02,03 |
#%summary | 先找第 i-1 个结点 p，再造新结点 s，把 s 插到 p 后面并补全两个方向。
#@d ============ 双向链表插入要动四根指针 ============
#@d 单链表插入动两根：
#@d
#@d     s->next = p->next;
#@d     p->next = s;
#@d
#@d 双向链表要动四根，因为新结点和前后两个邻居都要建立双向关系：
#@d
#@d     ① s->next = p->next;
#@d     ② if (p->next != NULL)  p->next->prior = s;
#@d     ③ s->prior = p;
#@d     ④ p->next = s;
#@d
#@d ①③ 是"新结点指出去"，②④ 是"邻居指回来"。四句缺一句，
#@d 链表就会变成"一个方向通、另一个方向断"——正向遍历一切正常，
#@d 反向遍历或后续删除时突然崩溃。这是最难查的一类 bug。
#@d
#@d ============ ②为什么要判空 ============
#@d 如果 i 正好等于表长 +1（插到表尾），那么 p->next 是 NULL，
#@d 此时 p 后面没有结点，也就没有人需要把 prior 指回来。
#@d 不判空就直接写 p->next->prior，等于对空指针取成员，程序当场崩溃。
#@d
#@d ============ 四步做完的过程 ============
#@d 目标：在第 2 个位置插入 15（即 [10] 之后）
#@d
#@d  插入前：  L ─▶ [头] ⇄ [10] ⇄ [20] ⇄ [30]
#@d                       p
#@d
#@d  ① s->next = p->next
#@d          [15] ──▶ [20]            （此时 p->next 还指着 [20]）
#@d
#@d  ② p->next->prior = s
#@d          [20] ◀── [15]            （[20] 的前驱从 [10] 改成 [15]）
#@d
#@d  ③ s->prior = p
#@d          [10] ◀── [15]            （[15] 的前驱指向 [10]）
#@d
#@d  ④ p->next = s
#@d          [10] ──▶ [15]            （[10] 的后继从 [20] 改成 [15]）
#@d
#@d  插入后：  L ─▶ [头] ⇄ [10] ⇄ [15] ⇄ [20] ⇄ [30]
#@d
#@d 还有一条铁律：**先判断能不能插，再造结点**。顺序颠倒会导致插入失败时
#@d 白白多出一个没挂上链表的"孤儿结点"。

#@s 参数 head 是头结点；i 是位置（从 1 开始），e 是数据
def ListInsert(head, i, e):
#@s p 要从头结点开始：因为插到第 1 位时，前驱就是头结点
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
#@d 先检查后造结点，避免产生孤儿结点
    if p is None or j > i - 1:
        return ERROR

#@s 造新结点
    s = creatNode(e)

#@s ① 新结点的 next 接住后面的那一串
    s.next = p.next
#@s ② 后面那个结点的 prior 改指新结点（表尾时 p.next 为空，必须判空）
    if p.next is not None:
        p.next.prior = s
#@s ③ 新结点的 prior 指向前驱（前驱一定存在，不用判空）
#@d 前驱要么是头结点，要么是真实结点，绝不会是 None —— 这正是头结点的价值
    s.prior = p
#@s ④ 前驱的 next 指向新结点，链表正式接上
    p.next = s

#@s 返回 OK 表示插入成功
    return OK
#%end

#%module | 10 | ListDelete | ListDelete —— 按位删除 | 3 | 01,03 |
#%summary | 定位到第 i 个结点，用它的 prior 摘链，再释放 —— 双向链表不必找前驱。
#@d ============ 这里体现双向链表真正的价值 ============
#@d 单链表要删除第 i 个结点，必须先找到第 i-1 个结点（前驱），
#@d 因为只有前驱能改 next 把待删结点绕过去：
#@d
#@d     单链表：  走 i-1 步找到前驱 p  →  改 p 一根指针  →  free
#@d
#@d 双向链表的第 i 个结点自己就带着 prior，压根不需要那个前驱变量：
#@d
#@d     双向链表：走 i 步定位到待删结点 p  →  用 p->prior 直接改两根指针  →  free
#@d
#@d 少了一次"找前驱"的过程，代码也更直白：删谁就站在谁身上操作。
#@d
#@d ============ 为什么 p->prior 不用判空 ============
#@d 因为 p 是第 i 个数据结点（i ≥ 1），它的前驱**至少是头结点**，
#@d 永远不可能是 NULL。头结点在这里又一次当了哨兵。
#@d 而 p->next 有可能是 NULL（删的正好是尾结点），所以那一句要判空。
#@d
#@d ============ 两根指针 + 一次 free ============
#@d 目标：删除第 2 个结点（值为 15）
#@d
#@d  删除前：  L ─▶ [头] ⇄ [10] ⇄ [15] ⇄ [20] ⇄ [30]
#@d                                p
#@d
#@d  ① p->prior->next = p->next
#@d          [10] ──▶ [20]            （[10] 的后继越过 [15]）
#@d
#@d  ② p->next->prior = p->prior
#@d          [20] ◀── [10]            （[20] 的前驱越过 [15]）
#@d
#@d  ③ free(p)
#@d          [15] 这块内存还给系统，p 变成野指针
#@d
#@d  删除后：  L ─▶ [头] ⇄ [10] ⇄ [20] ⇄ [30]
#@d
#@d 顺序要点：一定要先把 p->data 存进 *e，再 free(p)；
#@d free 之后再去读 p->data 就是"释放后使用"，属于未定义行为。
#@d
#@d ============ Python 里没有 free ============
#@d   摘链只做两步（改两根指针），第三步 free(p) 不用写 ——
#@d   当没有任何变量指向 p 时，Python 自己会回收它。
#@d   但"先取数据再摘链"的顺序还是保留着，好和 C 版对照。

#@s 返回 (状态, 被删掉的元素)；失败时值是 None
def ListDelete(head, i):
#@s 注意：直接从第 1 个数据结点起步，目标是"第 i 个结点自己"
#@d 单链表这里必须从头结点起步去找前驱，双向链表不需要
    p = head.next
#@s j 与 p 同步，表示 p 是第几个结点
    j = 1

#@s 走 i 步，让 p 停在待删结点上
    while p is not None and j < i:
#@s 指针后移
        p = p.next
#@s 计数器同步
        j += 1

#@s 越界检查：p 为空说明第 i 个结点不存在
    if p is None or j > i:
        return ERROR, None

#@s 先把数据取出来交给调用者（顺序上和 C 版一致）
    e = p.data

#@s ① 前驱的后继越过 p
#@d p.prior 一定非空：它至少是头结点
    p.prior.next = p.next
#@s ② 后继的前驱越过 p（删的是尾结点时 p.next 为空，必须判空）
    if p.next is not None:
        p.next.prior = p.prior
#@d 这里原本是 free(p)。Python 不用写 —— p 没人引用后就自动回收了。

#@s 删除成功，把被删的值一起交出去
    return OK, e
#%end

#%module | 11 | printList | printList —— 正向打印 | 1 | 01 |
#%summary | 顺着 next 从头走到尾，把每个结点的数据打出来。
#@d ============ 正向遍历：和单链表一模一样 ============
#@d
#@d   p = L->next;              ← 跳过不存数据的头结点
#@d   while (p != NULL) {       ← 走到 NULL 说明到尾了
#@d       ... 处理 p->data ...
#@d       p = p->next;          ← 千万别忘了这一句，否则死循环
#@d   }
#@d
#@d 输出用 `⇄` 而不是 `->`，是为了提醒这条链是**双向**的：
#@d 屏幕上看到的每个 `⇄`，在内存里都对应两根指针。
#@d
#@d 真正体现双向价值的是下一个模块 —— 反向打印。
#@d
#@d ============ 输出要和 C 版逐字节一致 ============
#@d C 是 printf("%d ⇄ ")，每个数后面都跟一个 "⇄ "（包括最后一个），
#@d 所以行尾是 "⇄ NULL"。Python 这里用 print(end='') 逐段拼，
#@d 不用 ' '.join —— 那样会把箭头漏掉、空格也不一样。

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

#@s 标准遍历
    while p is not None:
#@s 打印当前数据，`⇄` 表示这里是双向连接
        print(f'{p.data} ⇄ ', end='')
#@s 推进到下一个结点
        p = p.next

#@s 收尾打印 NULL，标明链表末端
    print('NULL')
#%end

#%module | 12 | printListReverse | printListReverse —— 反向打印 | 2 | 01,03 |
#%summary | 先走到尾结点，再顺着 prior 一路走回头结点 —— 单链表做不到这件事。
#@d ============ 这就是双向链表多一个指针换来的能力 ============
#@d 单链表想倒着打印，只有两条路：
#@d   1. 递归（函数调用栈替你记住来路，但表长了会爆栈）；
#@d   2. 先把数据全拷进数组，再倒着输出（额外 O(n) 空间）。
#@d 双向链表不用这么麻烦 —— prior 就在结点里，直接往回走。
#@d
#@d ============ 为什么循环条件是 p != L 而不是 p != NULL ============
#@d 这是本模块最容易写错的地方。
#@d
#@d   反向走的时候，如果写 while (p != NULL)：
#@d     p 会一路走过头结点，而头结点的 data 是**没意义的垃圾值**，
#@d     屏幕上会莫名其妙多打一个数；再往后 p 变成 NULL 才停。
#@d
#@d   正确写法是 while (p != L)：
#@d     走到头结点就停 —— 头结点是哨兵，不该被当成数据打印。
#@d
#@d 顺带一提：正因为头结点的 prior 是 NULL，如果哪一步把"停"的条件写错，
#@d 就会顺着 NULL 继续取 prior，直接崩掉。
#@d
#@d ============ 走法示意 ============
#@d
#@d  第一步：顺着 next 找到尾结点
#@d    L ─▶ [头] ⇄ [10] ⇄ [20] ⇄ [30]
#@d                                  p
#@d
#@d  第二步：顺着 prior 一路往回，边走边打印，直到撞上头结点
#@d    L ─▶ [头] ⇄ [10] ⇄ [20] ⇄ [30]
#@d            p ◀──── 返回路径
#@d
#@d  屏幕上得到：  30 ⇄ 20 ⇄ 10 ⇄ NULL

#@s 只读操作，不需要修改链表
def printListReverse(head):
#@s 从头结点后面开始
    p = head.next

#@s 空表同样单独处理
    if p is None:
#@s 空表提示
        print('(空表)')
#@s 直接返回
        return

#@s 第一步：顺着 next 走到尾结点
#@d 条件写 p.next != None，所以停下时 p 正好是最后一个结点
    while p.next is not None:
#@s 指针后移
        p = p.next

#@s 第二步：顺着 prior 往回走，撞到头结点就停
#@d 这里必须写 p != head，不能写 p != None —— 头结点不能被当成数据打印
    while p is not head:
#@s 打印当前数据
        print(f'{p.data} ⇄ ', end='')
#@s 顺着 prior 往回走一格（单链表没有这一步可走）
        p = p.prior

#@s 收尾
    print('NULL')
#%end

#%module | 13 | freeList | freeList —— 释放内存 | 2 | 01,03 |
#@d ============ 释放只需要 next 方向 ============
#@d 虽然结点里有 prior，但释放时**根本用不到它** ——
#@d 因为必须先把整条链走完才能全部释放，而"走完"只需要 next。
#@d
#@d ============ 为什么必须先保存 next ============
#@d
#@d  错误写法：                正确写法：
#@d    free(p);                  q = p;
#@d    p = p->next;   ← 危险!    p = p->next;
#@d                             free(q);
#@d
#@d free(p) 之后那块内存已经还给系统，p->next 读到的是垃圾值，
#@d 用这个垃圾值当地址去访问就是"释放后使用"（use after free）。
#@d
#@d 更危险的是：如果在 free(p) 之前先去动 p->prior->next 之类的指针
#@d （双向链表很容易顺手这么写），会把已经损坏的链再改一次，
#@d 崩溃点离真正的错误点非常远，极难排查。
#@d
#@d ============ Python 版只做"断链" ============
#@d   没有 free 可调，要做的是把每个结点的 prior / next 都断开，
#@d   让整条链上再没有变量指向它，Python 就会自动回收。
#@d
#@d   这里连 prior 也要一起断 —— 双向链表只断 next 还不够，
#@d   因为 prior 方向还互相引用着，整串结点会一起留着。
#@d
#@d ============ 参数用"盒子" ============
#@d   C 的 DuLinkList *L 最后要写 *L = NULL 把调用者的指针清掉。
#@d   Python 里给参数重新赋值传不出去，所以用 box = [head] 包一层，
#@d   改 box[0] 调用者看得见 —— 对应 C 的 *L = NULL。
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
#@s 把当前结点两个方向都断掉
        p.prior = None
        p.next = None
#@s p 走到下一个
        p = nxt

#@s 数据结点都清完了，头结点也断开
    box[0].next = None
    box[0].prior = None
#@s 把盒子里的 L 置成 None，调用者那边看到的也是 None
#@d 这一步对应 C 的 *L = NULL
    box[0] = None
#%end

#%module | 14 | main | main —— 主函数测试 | 2 | 01,02,03,04,05,06,07,08,09,10,11,12,13 |
#%summary | 把增、删、查、改四类操作各跑一遍，正反向遍历对照验证 prior 没写错。
#@d ============ 双向链表的测试要多做一件事 ============
#@d 单链表只要正向打印对，基本就对了。
#@d 双向链表**每一步都要正反向打印对照** —— 因为漏改 prior 的 bug
#@d 正向完全看不出来，只有反向遍历（或后续的删除）才会暴露。
#@d
#@d 所以本测试里每次改动链表之后，都会同时打印正向和反向，
#@d 两个方向互为对方的"校验和"。
#@d
#@d 另外一定要测三种边界：
#@d   1. 空表      （初始化后立刻打印）
#@d   2. 越界位置  （插入/查找/修改/删除一个不存在的位置，应返回 ERROR）
#@d   3. 删尾结点  （专门验证 p->next == NULL 那条判空分支）
#@d
#@d ============ 和 C 版的写法差别 ============
#@d   1. 出口参数没了：GetElem_L 和 ListDelete 改成一次接两个返回值。
#@d   2. 三元表达式顺序相反：C 的 cond ? "A" : "B"，
#@d      Python 写成 "A" if cond else "B"，条件在中间。
#@d   3. freeList 要传"盒子" [L]，因为要把 L 本身置成 None。

#@s 主函数：Python 用 if __name__ 的固定写法代替 C 的 main
if __name__ == '__main__':
#@s L 是头结点，由 InitList 创建
    L = InitList()

#@s ========== 第 1 步：初始化 ==========
    print('========== 1. 初始化 ==========')
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
#@s 期望正向：10 ⇄ 20 ⇄ 30 ⇄ NULL
    print('追加后（正向）：', end='')
    printList(L)
#@s 期望反向：30 ⇄ 20 ⇄ 10 ⇄ NULL
#@d 反向能打对，说明尾插时 s->prior = p 那一句没漏
    print('追加后（反向）：', end='')
    printListReverse(L)

#@s ========== 第 3 步：头插法 ==========
    print()
    print('========== 3. 头插法插入 5 ==========')
#@s 头插 5：不遍历，直接变成第 1 个结点
    HeadInsert(L, 5)
#@s 期望正向：5 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL
    print('头插 5 后（正向）：', end='')
    printList(L)
#@s 反向也要对：30 ⇄ 20 ⇄ 10 ⇄ 5 ⇄ NULL
    print('头插 5 后（反向）：', end='')
    printListReverse(L)

#@s ========== 第 4 步：按位插入 ==========
    print()
    print('========== 4. 在第 2 位插入 15 ==========')
#@s 插到第 2 个位置，即 5 和 10 之间
    ListInsert(L, 2, 15)
#@s 期望正向：5 ⇄ 15 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL
    print('插入后（正向）：', end='')
    printList(L)
#@s 反向核对：30 ⇄ 20 ⇄ 10 ⇄ 15 ⇄ 5 ⇄ NULL
    print('插入后（反向）：', end='')
    printListReverse(L)

#@s 越界测试：在第 99 位插入必须失败
#@d 写成一条 f-string：print 传多个参数会用空格分隔，printf 不会
    print(f'在第 99 位插入 5 ：{"成功" if ListInsert(L, 99, 5) == OK else "失败（越界，符合预期）"}')

#@s ========== 第 5 步：按位查找 ==========
    print()
    print('========== 5. 按位查找 ==========')
#@s 查第 3 个元素
#@d 此时链表是 5 ⇄ 15 ⇄ 10 ⇄ 20 ⇄ 30，第 3 个是 10
    r, e = GetElem_L(L, 3)
    if r == OK:
#@s 期望输出：10
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
#@s 找到就同时验证前后两个方向
    if p is not None:
#@s 双向链表的好处：拿到结点就能同时说出它的前驱和后继
        print(f'找到 20：它的前驱是 {p.prior.data}，后继是 {"一个有效结点" if p.next is not None else "NULL"}')
#@s 找不存在的值应当返回 None
    if LocateElem(L, 99) is None:
#@s 期望走到这里
        print('查找值 99 返回 NULL（符合预期）')

#@s ========== 第 7 步：按位修改 ==========
    print()
    print('========== 7. 按位修改 ==========')
#@s 把第 1 个元素改成 99
    if ModifyElem(L, 1, 99) == OK:
#@s 期望正向：99 ⇄ 15 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL
        print('把第 1 个元素改成 99 后：', end='')
        printList(L)
#@s 越界修改测试
    print(f'改第 100 个元素：{"成功" if ModifyElem(L, 100, 1) == OK else "失败（越界，符合预期）"}')

#@s ========== 第 8 步：正反向遍历对照 ==========
    print()
    print('========== 8. 正反向遍历对照 ==========')
#@s 同一份链表，两个方向必须互为倒序
    print('正向：', end='')
    printList(L)
    print('反向：', end='')
    printListReverse(L)

#@s ========== 第 9 步：按位删除 ==========
    print()
    print('========== 9. 删除第 2 个结点 ==========')
#@s 删除第 2 个结点（值为 15），被删的值一起返回
    r, e = ListDelete(L, 2)
    if r == OK:
#@s 期望输出：被删除的是 15
        print(f'已删除第 2 个结点，它的值是 {e}')
#@s 期望正向：99 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL
    print('删除后（正向）：', end='')
    printList(L)
#@s 反向核对：30 ⇄ 20 ⇄ 10 ⇄ 99 ⇄ NULL
    print('删除后（反向）：', end='')
    printListReverse(L)

#@s 越界删除测试
    r, _ = ListDelete(L, 10)
    print(f'删除第 10 个结点：{"成功" if r == OK else "失败（越界，符合预期）"}')

#@s ========== 第 10 步：删尾结点（专测判空分支）==========
    print()
    print('========== 10. 删除尾结点 ==========')
#@s 此时链表是 99 ⇄ 10 ⇄ 20 ⇄ 30，共 4 个结点
#@d 删尾结点会走到 p->next == NULL 那条分支 —— 也就是不执行"后继的 prior 改指"。
#@d 这条分支不测，删尾结点时的崩溃就永远不会被发现。
    r, e = ListDelete(L, 4)
    if r == OK:
        print(f'已删除尾结点，它的值是 {e}')
#@s 期望正向：99 ⇄ 10 ⇄ 20 ⇄ NULL
    print('删除尾结点后（正向）：', end='')
    printList(L)
#@s 反向核对：20 ⇄ 10 ⇄ 99 ⇄ NULL
    print('删除尾结点后（反向）：', end='')
    printListReverse(L)

#@s ========== 第 11 步：释放整表 ==========
    print()
    print('========== 11. 释放内存 ==========')
#@s 释放所有结点。Python 版要传"盒子"，因为它把盒子里的 L 置成 None
    box = [L]
    freeList(box)
#@s 期望输出：NULL，证明 L 已被正确置空
    print(f'释放完成，L = {"NULL" if box[0] is None else "非 NULL"}')
#%end
