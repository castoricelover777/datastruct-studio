#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 数组 + 链表：每格存一条链表的头。
#@d ============ "虚拟头结点"是什么 ============
#@d
#@d 数组的每一格本身就是一个 LNode，它的 Data 字段**不用**，
#@d 只用它的 Next 指针来挂真正的元素。
#@d
#@d 这个"不存数据的头"叫**虚拟头结点**（dummy head），好处是：
#@d
#@d   · 每个桶都天然非空，插入时不用特判"链表还空着"
#@d   · 删除时不用特判"删的是第一个结点"（因为第一个真正的元素永远不是头）
#@d
#@d 省掉一堆 if 判断，代码短很多。这是链表实现里非常常用的技巧。
#@d
#@d ============ 表长还要取素数吗 ============
#@d
#@d 还是要。虽然"分布均匀"的要求比开放地址法松一点，但取素数仍然有益。
#@d
#@d 不过有个细节差别：**分离链接法的装填因子可以大于 1**。
#@d
#@d   开放地址法：α 必须 < 1（否则没空位了）
#@d   分离链接法：α = 3 也行 —— 平均每条链表挂 3 个元素，查找就是走 3 步
#@d
#@d 所以分离链接法在"元素数远超表长"时依然能用，只是性能会线性下降。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 那两层 struct 和 typedef 在 Python 里就是两个 class，字段在 __init__ 里摆好。
#@d   C 的表是一整块数组加一个指针，Python 直接用一个列表装 11 个桶对象。
#@d   最重要的一条：C 要 malloc 才有结点，Python 一句 LNode() 就有了，也没有 free。

#@s 元素类型
#@d C 的 typedef int ElementType; 是给类型起别名，Python 不看类型，这句只当记号留着。
ElementType = int

#@s 链表结点
#@d C 里 struct LNode 里存的是"下一个结点的地址"，Python 里 self.next 直接就是下一个对象，
#@d 走到头的时候它是 None，正好对应 C 的 NULL。
class ListNode:
    #@s 每个结点都有这两个字段
    def __init__(self, data=None):
        #@s 存的关键字（头结点这个字段不用）
        self.data = data
        #@s 下一个结点
        self.next = None

#@s 位置（就是结点指针）
#@d C 的 Position 和 List 都是 PtrToLNode（一个结点指针）的别名，
#@d Python 里没有指针类型，这两个别名只作为记号保留。
Position = ListNode
#@s 链表
List = ListNode

#@s 散列表
#@d C 的 struct TblNode 是"表长 + 一个指针"，Python 就是一个有两个属性的类。
class HashTable:
    #@s 表长（素数）
    def __init__(self, table_size=0):
        self.TableSize = table_size
        #@s 链表头数组
        #@d C 的 List Heads; 只是声明了一个指针，真正那一排桶是 CreateTable 里 malloc 的；
        #@d Python 先给个空列表占位，桶在 CreateTable 里一个个造出来。
        self.Heads = []

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 只当记号留着，Python 不看返回类型。
Status = int

#@s 表的最大容量
#@d Python 没有 #define，宏就是一个普通常量，值照抄 C 的 20000。
MAXTABLESIZE = 20000

#@s 取不小于 N 的下一个素数
def NextPrime(N):
    #@s 循环用
    #@d C 开头要先写 int i; 声明变量，Python 不用声明，下面 for 里直接拿来用。
    #@s 待检查
    #@d C 还要写一句 int p;，Python 里 p 第一次出现就自动有了。

    if N <= 2:
        #@s 2 本身就是素数
        return 2
    if N <= 3:
        #@s 3 也是素数
        return 3

    #@s 从 N 本身开始（N 是偶数就先加一到奇数）
    p = N if N % 2 != 0 else N + 1

    while p <= MAXTABLESIZE:
        #@s 从 p/2 往下试除，看看有没有因子
        #@d C 的 p / 2 是两个 int 相除，本来就是整除；Python 的 / 会算出小数，
        #@d 所以这里必须写成 p // 2。
        i = p // 2
        #@d C 写的是 for (i = p/2; i > 2; i--)，循环自己会做 i--，退出时 i 正好是 2。
        #@d Python 的 for i in range(...) 取不到终点那个数，照抄的话 i 会停在 3 而不是 2，
        #@d 下面那句 if i == 2 永远不成立 —— 结果会一路加到 MAXTABLESIZE。
        #@d 所以这里改用 while 手写 i -= 1，和 C 的循环一模一样。
        while i > 2:
            if p % i == 0:
                #@s 找到了因子，说明 p 不是素数
                break
            #@s 往下试下一个因子
            i -= 1
        #@s i 一路走到 2 说明一个因子都没找到
        if i == 2:
            break
        #@s 只试奇数
        p += 2
    #@s 返回找到的素数
    return p

#@s 建一个空表
def CreateTable(TableSize):
    #@s 表
    #@d C 要先写 HashTable H; 声明一个表指针，Python 等下面造好了直接赋给 H。
    #@s 分配表结构
    #@d C 要先 malloc(sizeof(struct TblNode)) 再一格一格填，Python 一句 HashTable() 就够了。
    H = HashTable()
    #@s 表长取素数
    H.TableSize = NextPrime(TableSize)

    #@s 分配链表头数组
    #@d C 是 malloc(表长 * sizeof(struct LNode))，一次申请一整排连续内存；
    #@d Python 没有这种"申请"，直接用循环造出表长个结点对象，装进一个列表。
    #@d 一句 [ListNode() for _ in range(H.TableSize)] 就够，而且每个桶都是**各自独立**的对象。
    H.Heads = [ListNode() for _ in range(H.TableSize)]

    #@s 每格的 Data 不用，Next 置空
    for i in range(H.TableSize):
        #@s 头结点的数据字段不用
        H.Heads[i].data = None
        #@s 链表先空着
        H.Heads[i].next = None

    #@s 把建好的表交出去
    return H

#@s 释放整张表
def DestroyTable(H):
    #@s 循环用
    #@s 遍历指针和下一个
    #@d C 要写 Position P, tmp; 两个指针变量，Python 等到用的时候直接写名字就行。

    if H is None:
        return

    #@s 逐条链表释放
    for i in range(H.TableSize):
        #@s 从第一个真结点开始
        P = H.Heads[i].next

        while P is not None:
            #@s 先记住下一个
            tmp = P.next
            #@s 再释放当前
            #@d C 这里是 free(P)，把结点还给系统；Python 没有 free，
            #@d 把当前的 next 剪断（置成 None），让链条一节一节散开，剩下的交给自动回收。
            P.next = None
            #@s 往后走
            P = tmp

    #@s 先 free 头数组
    #@d C 这里是 free(H->Heads)，再 free(H)。Python 把这两个引用清掉就行。
    H.Heads = []
    #@s 再 free 表结构
    #@d C 的最后一句 free(H) 在这里对应 Python 的 del，把表对象也清掉。
    del H
#%end

#%module | 02 | Hash | Hash —— 散列函数 | 2 | 01 |
#%summary | 还是除留余数法 —— 落到的那个格子，就是它要挂的链表。
#@d ============ 这里的散列函数作用变了 ============
#@d
#@d 开放地址法里，散列函数算出的位置是"起点"，冲突了还要往后探测。
#@d
#@d 分离链接法里，散列函数算出的位置就是**最终归属** ——
#@d 它决定了这个元素挂在哪条链表上，之后就不动了。
#@d
#@d 所以散列函数的质量对分离链接法的影响更直接：
#@d
#@d   散列函数好 → 各条链表长度差不多 → 查找走几步就够
#@d   散列函数差 → 有的链表长、有的空着 → 长的那些退化成线性查找
#@d
#@d 这也是为什么"分布均匀"永远是散列的第一要求。
#@d
#@d ============ 复杂度 ============
#@d
#@d 查找的代价是"遍历所在链表"，所以平均是 **O(1 + α)**，
#@d α 是装填因子（平均每条链表的长度）。
#@d
#@d 注意这里 α 可以大于 1。α = 3 意味着平均走 3 步 —— 还是常数级，
#@d 但比开放地址法那种"一次数组访问"慢。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   Hash 两边长得一模一样，只是 Python 用 % 号，C 也是 % 号，连算出来的余数都相同。
#@d   真正要小心的是 LoadFactor：C 写了 (double)count / H->TableSize 才不丢小数，
#@d   Python 的 / 本来就是真除法，所以不用先转成小数，直接除就行。
#@d   两边都返回小数这一点是一致的，打印出来都是 1.09。

#@s 除留余数法
def Hash(Key, TableSize):
    #@s 取余数就是它该挂的桶号
    return Key % TableSize

#@s 算装填因子（对分离链接法来说就是"平均链表长度"）
#@d 注意这里统计的是**真正的元素个数**，不含头结点。
def LoadFactor(H):
    #@s 循环用
    #@s 元素总数
    count = 0

    for i in range(H.TableSize):
        #@s 遍历指针
        #@s 从第一个真结点开始数（跳过虚拟头结点）
        #@d C 写成 for (P = ...; P != NULL; P = P->Next) 一个循环头全包了；
        #@d Python 的 while 要自己把 P = P.next 写在循环体最后，少写一句就死循环。
        P = H.Heads[i].next
        while P is not None:
            #@s 数一个
            count += 1
            #@s 往后走
            P = P.next

    #@s 平均每条链表的长度
    #@d C 要显式写 (double)count 才不会被当成整除，Python 的 / 本来就给你小数。
    return count / H.TableSize
#%end

#%module | 03 | Find | Find —— 查找 | 2 | 01,02 |
#%summary | 先散列定位到某条链表，再顺着链表找。
#@d ============ 查找两步 ============
#@d
#@d   ① 用散列函数算出挂在哪条链表上
#@d   ② 顺着那条链表依次比较
#@d
#@d 第二步就是**普通的链表查找** —— 没有任何特别之处。
#@d
#@d 所以整个散列的复杂度分析可以拆开：
#@d
#@d   第一步 O(1)  +  第二步 O(链表长度)
#@d
#@d 而链表长度平均就是 α，所以总的是 O(1 + α)。
#@d
#@d ============ 为什么要返回"位置"而不是"找到了吗" ============
#@d
#@d 因为后面的删除要用到它 —— 知道结点在哪，才能从链表上摘下来。
#@d
#@d 返回 NULL 表示没找到。这个约定让查找、删除能共用同一个函数。
#@d
#@d ============ 和开放地址法的一个细微差别 ============
#@d
#@d 开放地址法的查找**必须区分"没找到"和"表满了"** —— 因为探测可能走遍全表。
#@d
#@d 分离链接法没这个问题：链表走到 NULL 就是没找到，干净利落。
#@d 这也是它的一个隐性优势：**逻辑更简单，不容易出边界 bug**。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   代码形状几乎一样：-> 换成点号，NULL 换成 None。
#@d   有一点要当心：C 里没找到返回 NULL，一个空指针；Python 返回的是 None。
#@d   拿到返回值以后判断要写 if P is None，不能写 if not P ——
#@d   结点对象的真假值不好说，拿 is None 判断才稳。

#@s 查找 Key，返回结点位置；没找到返回 NULL
def Find(H, Key):
    #@s 遍历指针
    #@d C 要先写 Position P; 声明一个遍历指针，Python 用到的时候直接写名字。
    #@s 这个键该挂在哪条链表上
    pos = Hash(Key, H.TableSize)

    #@s 从虚拟头结点的下一个开始
    P = H.Heads[pos].next

    #@s 顺着链表找
    #@d 两个终止条件：走到尾（没找到）、或者找到了。
    while P is not None and P.data != Key:
        #@s 不匹配就往后走
        P = P.next

    #@s 返回 P（找到就是结点，没找到就是 NULL）
    #@d 没找到时这里返回的是 None —— 它就是 Python 版的 NULL。
    return P
#%end

#%module | 04 | Insert | Insert —— 插入 | 3 | 01,02,03 |
#%summary | 先查重，再头插。
#@d ============ 插入两步 ============
#@d
#@d   ① 先查找，看这个键是不是已经存在（存在就不重复插入）
#@d   ② 不存在 → 造一个新结点，**头插**到对应链表上
#@d
#@d ============ 为什么用头插 ============
#@d
#@d 和邻接表一样：头插 O(1)，不用找尾，而且链表里的顺序本来就不重要。
#@d
#@d 但要注意一个后果：**同一条链表里的顺序和插入顺序相反**。
#@d
#@d 如果题目要求"按插入顺序输出同一条链上的元素"，就得改成尾插（多一个尾指针）
#@d 或者插完再反转。
#@d
#@d ============ 一个常被忽略的设计问题 ============
#@d
#@d 散列表里到底允不允许**重复关键字**？
#@d
#@d   · 作为"集合"用（比如去重）→ 不允许，插入前要查重
#@d   · 作为"多重集"用（比如统计词频）→ 允许，或者结点里加一个计数字段
#@d
#@d 本实现选择"不允许重复"，所以插入前先 Find 一次。
#@d 代价是每次插入多走一次链表 —— 想省这点开销也可以不查重（取决于需求）。
#@d
#@d Java 的 HashMap 采用"键相同就覆盖值"，也是一种处理方式。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 要 malloc 一个结点、检查返回是不是 NULL、失败还要 exit(1)；Python 一句 ListNode(Key) 就造好了，
#@d   所以那段防内存分配失败的代码整块不存在——不是我省了，是 Python 里没这回事。
#@d   头插那两句顺序照抄 C：先让新结点接住原来那一串，再让桶头指向新结点，写反链表就出环了。

#@s 插入 Key；已存在则什么都不做
#@d 返回插入位置（存在时返回已有结点）
def Insert(H, Key):
    #@s 新结点
    #@s 已有的结点
    #@s 该挂在哪条链上
    #@d C 开头要写 Position NewNode, P; 和 int pos; 三句声明，Python 用到哪写到哪。
    #@s ① 先查重
    P = Find(H, Key)
    if P is not None:
        #@s 已经存在，直接返回
        return P

    #@s ② 造新结点
    #@d C 这里是 malloc + 一段 if (NewNode == NULL) { printf; exit(1); }，
    #@d Python 没有内存分配失败这回事，整块直接省掉。
    NewNode = ListNode(Key)

    #@s 算出该挂哪条链
    pos = Hash(Key, H.TableSize)

    #@s ③ 头插到那条链上
    #@d 新结点的 Next 指向原来的第一个，头结点的 Next 指向新结点。
    NewNode.next = H.Heads[pos].next
    H.Heads[pos].next = NewNode

    #@s 返回新结点
    return NewNode
#%end

#%module | 05 | Delete | Delete —— 删除 | 3 | 01,02,03 |
#%summary | 从链表上摘掉结点，然后 free —— 干净利落，不留痕迹。
#@d ============ 为什么不需要墓碑 ============
#@d
#@d 开放地址法里，元素之间的"探测链"是靠数组位置串起来的，
#@d 删掉中间一个就会把链断掉 —— 所以只能标墓碑。
#@d
#@d 分离链接法里，元素之间的连接是**链表指针**。
#@d 从链表上摘掉一个结点，剩下的结点之间的指针依然连着，**什么都没断**。
#@d
#@d 所以直接 free 掉就行。这是分离链接法一个很实在的优势。
#@d
#@d ============ 链表删除的标准三步 ============
#@d
#@d   ① 找到待删结点的**前一个**（这样才能改它的 Next）
#@d   ② 前一个的 Next 指向待删结点的 Next（把它"绕过"）
#@d   ③ free 掉待删结点
#@d
#@d 第 ① 步是关键：单向链表里你没法从当前结点回到前一个，
#@d 所以**删除操作必须从头开始找前驱**，不能只拿到当前结点指针。
#@d
#@d （用双向链表可以避免，但散列没必要为此付出额外空间。）
#@d
#@d 有了虚拟头结点，第 ① 步会简单很多：
#@d 直接从虚拟头结点开始，前驱初始就是它 —— 不用特判"删的是第一个元素"。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 那句 Prev = &H->Heads[pos] 是"取桶头这个结点的地址"，Python 不用取地址，
#@d   直接写 Prev = H.Heads[pos] 拿到的就是那个桶头对象，后面改 Prev.next 一样管用。
#@d   还有 C 最后要 free(P)，Python 不写：把 Prev.next 绕过 P 之后，P 就没人指着了，自己会被回收。

#@s 删除 Key；成功返回 OK，不存在返回 ERROR
def Delete(H, Key):
    #@s 前驱结点（从虚拟头开始）
    #@s 当前结点
    #@s 该在哪条链上
    #@d C 要先写 Position Prev, P; 和 int pos; 三句声明，Python 直接赋值就行。
    #@s 算出链表位置
    pos = Hash(Key, H.TableSize)

    #@s 从虚拟头结点开始
    #@d 因为头结点有 Next 字段，删除第一个真元素时不用特判。
    Prev = H.Heads[pos]
    P = Prev.next

    #@s 找待删结点
    while P is not None and P.data != Key:
        #@s 前驱和当前一起往后走
        Prev = P
        P = P.next

    #@s 走到尾都没找到
    if P is None:
        return ERROR

    #@s 把它从链上绕过
    Prev.next = P.next

    #@s 释放
    #@d C 这里是 free(P)。Python 一句都不用写 —— 现在没人引用 P 了，它会被自动回收。
    #@d 所以这一步只有"剪断"这个动作，没有"还给系统内存"这个动作。

    #@s 成功
    return OK
#%end

#%module | 06 | PrintTable | PrintTable —— 打印与分布统计 | 1 | 01,02 |
#%summary | 打印每条链表，统计长度分布。
#@d ============ 为什么专门统计"链表长度分布" ============
#@d
#@d 因为对分离链接法来说，**性能直接由最长的链表决定**。
#@d
#@d   平均长度 2，但最长 20 → 那 20 个元素的查找都是 O(20)
#@d
#@d 所以光看平均装填因子不够，还要看**最长链表有多长**。
#@d
#@d 理想情况下，n 个元素散到 m 个桶里，最长链表大约 O(log n / log log n)
#@d —— 这是"球放入桶"问题的经典结论，虽然理论上可能很长，实践中很少发生。
#@d
#@d 但**如果散列函数有缺陷**，最长链表可能长得多。所以这个统计很有诊断价值。
#@d
#@d Java 8 给 HashMap 加的那条规则就是这个思路的极致：
#@d **链表长度超过 8 就转成红黑树**，把最坏情况从 O(n) 降到 O(log n)。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 用 %2d 把桶号补成两位，Python 里就是 f'{i:2d}'，写法不同效果一样。
#@d   箭头那个符号两边都直接写在字符串里，谁也没转义。
#@d   最容易踩的坑是 print：Python 的 print 自动换行、多个参数之间还自动加空格，
#@d   C 的 printf 两样都不做。所以这里该写 end='' 的都写了，输出才对得上。

#@s 打印散列表的每一条链表
def PrintTable(H):
    #@s 循环用
    for i in range(H.TableSize):
        #@s 桶号补成两位，后面留一个空格
        print(f'  [{i:2d}] ', end='')
        #@s 从第一个真结点开始
        P = H.Heads[i].next

        #@s 链表空着
        if P is None:
            print('(空)', end='')

        #@s 打印链表上的元素
        while P is not None:
            #@s 打元素，不带空格
            print(f'{P.data}', end='')
            if P.next is not None:
                #@s 不是最后一个就补一个箭头
                print(' → ', end='')
            #@s 往后走
            P = P.next
        #@s 每条链表占一行
        print()

#@s 统计链表长度的分布
def PrintStats(H):
    #@s 循环用
    #@s 遍历指针
    #@s 当前链表长度
    #@s 最长链表
    maxLen = 0
    #@s 空链表的条数
    empty = 0
    #@s 元素总数
    total = 0
    #@s 长度分布的计数（长度 0~9）
    #@s 清零
    #@d C 要写 int dist[10] 再手工清零；Python 一句 [0] * 10 就是 10 个格子，本来就全是 0，
    #@d 所以 C 里那个清零的 for 循环在 Python 里没有对应的一行。
    dist = [0] * 10

    #@s 逐条统计
    for i in range(H.TableSize):
        #@s 当前链表长度
        #@d C 在函数开头就声明了 len，Python 每次循环重新给 length 起一个新值。
        length = 0
        #@s 遍历指针
        P = H.Heads[i].next
        while P is not None:
            length += 1
            P = P.next

        #@s 累计元素总数
        total += length
        if length > maxLen:
            #@s 刷新最长链表
            maxLen = length
        if length == 0:
            #@s 又一条空链
            empty += 1
        if length < 10:
            #@s 长度 0~9 的记进分布表
            dist[length] += 1

    #@s 输出
    #@d C 那句 printf 里的 %.2f 对应 Python 的 :.2f，两边都是保留两位小数。
    print(f'  表长 = {H.TableSize}，元素 = {total}，装填因子 = {total / H.TableSize:.2f}')
    print(f'  空链表 {empty} 条，最长链表 {maxLen} 个元素')
    #@s 头一行结尾不换行，等下面拼完再换
    print('  长度分布（长度:条数）: ', end='')
    for i in range(10):
        if dist[i] > 0:
            #@s 每项后面固定两个空格，和 C 版一模一样
            print(f'{i}:{dist[i]}  ', end='')
    print()
    print('  （最长链表决定最坏情况的查找代价 —— 它比平均值更值得关注）')
    #@s 统计完再空一行，和 C 版最后那句单独的 printf("\n") 对齐
    print()
#%end

#%module | 07 | main | main —— 分离链接法跑一遍 | 3 | 01,02,03,04,05,06 |
#%summary | 插入、查找、删除，并和开放地址法对比。
#@d ============ 这个例子的看点 ============
#@d
#@d 用一批"散列位置集中"的关键字（都能被 11 整除），这样链表会长起来，
#@d 能看清"同一条链上的元素"和"头插导致的逆序"。
#@d
#@d 另外要看两件事：
#@d
#@d   ① 装填因子可以大于 1（这里放 12 个元素、表长 11）
#@d   ② 删除**不需要墓碑**，直接从链表摘掉
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 换成 Python 的 if __name__ == '__main__':，程序跑到这里才会执行。
#@d   那些 static const int keys[] 数组，Python 直接写成普通列表就行。
#@d   最容易踩的坑是 print：print(x, end=' ') 用来照抄 printf("%d ", x)，这样每个数后面都有空格，
#@d   连最后一个也有；而 C 的三元 a ? b : c 要写成 b if a else c，条件跑到中间去了。

#@s 主函数
if __name__ == '__main__':
    #@s 一批都会散列到 0 号桶的关键字
    #@d 11、22、33、44、55、66 都能被 11 整除，余数全是 0。
    keys = [11, 22, 33, 44, 55, 66, 77, 88]
    #@s 另外几个散到别处的
    others = [5, 16, 27, 38]
    #@s 个数
    n = 8
    m = 4

    #@s 表
    #@d C 要先写 HashTable H; 声明这张表，Python 直接等 CreateTable 的返回值。
    #@s 循环用
    #@s 查找结果
    #@d C 要写 int i; 和 Position P; 两句声明，Python 用到哪写到哪。

    #@s 建表
    H = CreateTable(11)

    print(f'表长 = {H.TableSize}（素数）')
    print('插入 8 个都能被 11 整除的关键字 → 它们会挂在同一条链上')
    #@s 空一行
    print()

    #@s 插入
    for i in range(n):
        Insert(H, keys[i])
    for i in range(m):
        Insert(H, others[i])

    #@s 打印
    print('=== 表的内容 ===')
    PrintTable(H)

    #@s 统计
    print()
    print('=== 统计 ===')
    PrintStats(H)
    print(f'注意 [0] 号桶挂了 {n} 个元素（都是 11 的倍数）')
    print('（这就是「散列函数选得差」的后果 —— 分布严重不均）')
    #@s 空一行
    print()

    #@s 查找
    print('=== 查找 ===')
    for i in range(3):
        P = Find(H, others[i])
        print(f'  找 {others[i]}: {"找到了" if P else "没找到"}')
    P = Find(H, keys[0])
    print(f'  找 {keys[0]}: {"找到了" if P else "没找到"}')
    P = Find(H, 999)
    print(f'  找 999（不存在）: {"找到了" if P else "没找到"}')

    #@s 注意头插的顺序
    print()
    print('=== 头插的后果 ===')
    #@s 行尾不换行，等数字打完了再换
    print('  插入顺序: ', end='')
    for i in range(5):
        #@s 每个数后面都跟一个空格（包括最后一个），照抄 C 的 printf("%d ", ...)
        print(f'{keys[i]} ', end='')
    print()

    #@s 打印 0 号桶
    pos = Hash(keys[0], H.TableSize)
    print(f'  [{pos}] 号桶实际顺序: ', end='')
    P = H.Heads[pos].next
    while P is not None:
        print(f'{P.data} ', end='')
        P = P.next
    print()
    print('  （和插入顺序**相反** —— 因为用的是头插）')

    #@s 删除
    print()
    print('=== 删除 ===')
    print(f'  删除 33: {"成功" if Delete(H, 33) == OK else "失败"}')
    print(f'  删除 999（不存在）: {"成功" if Delete(H, 999) == OK else "失败"}')
    print(f'  删除之后再找 33: {"还在" if Find(H, 33) else "确实没了"}')

    print()
    print('  [0] 号桶现在是: ', end='')
    pos = Hash(keys[0], H.TableSize)
    P = H.Heads[pos].next
    while P is not None:
        print(f'{P.data} ', end='')
        P = P.next
    #@s 这里只补一个换行 —— C 版也是打完数字直接换行，前面没有空格
    print()
    print('  （直接从链表摘掉了 —— **不需要墓碑**）')

    #@s 对比
    print()
    print('=== 和开放地址法对比 ===')
    print('  分离链接法：')
    print(f'    · 装填因子可以大于 1（这里 {n + m} 个元素 / {H.TableSize} 个桶）')
    print('    · 删除简单，不需要墓碑')
    print('    · 代价：每个元素要 malloc，链表结点在内存里是散的')
    print()
    print('  开放地址法：')
    print('    · 装填因子必须 < 1，到 0.75 就该扩容')
    print('    · 删除要留墓碑')
    print('    · 优势：全在一个数组里，顺序访问对 CPU 缓存友好')
    print()
    print('  所以：元素数能预估、在意缓存性能 → 开放地址法')
    print('        元素数不确定、频繁删除       → 分离链接法')

    #@s 释放
    DestroyTable(H)
    print()
    print('表已释放（逐条链表释放结点，再 free 头数组，最后 free 表结构）')

    #@s 结课
    print()
    print('===== 到这里，陈越《数据结构》的六章内容全部讲完了 =====')

    #@s 正常结束
    #@d C 的 main 是 return 0;，Python 脚本正常跑完就是"正常结束"，不用写返回语句。
#%end
