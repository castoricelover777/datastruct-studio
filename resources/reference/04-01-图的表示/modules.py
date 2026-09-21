#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 邻接矩阵用二维数组，邻接表用"数组 + 链表"。
#@d ============ 邻接矩阵长什么样 ============
#@d
#@d 一个二维数组 G[nv][nv]，G[i][j] 表示从 i 到 j 有没有边：
#@d
#@d             0  1  2  3
#@d        0 [  0  1  0  1 ]
#@d        1 [  1  0  1  0 ]
#@d        2 [  0  1  0  1 ]
#@d        3 [  1  0  1  0 ]
#@d
#@d 特点：
#@d
#@d   · 判断"i 和 j 之间有没有边"只要**一次数组访问**，O(1) —— 这是它最大的优点
#@d   · 无向图的矩阵是**对称**的（G[i][j] == G[j][i]），所以有一半空间是浪费的
#@d   · 不管图里实际有多少条边，都要占 n² 个格子
#@d
#@d 所以邻接矩阵适合**稠密图**（边数接近 n²）：反正都要占这么多空间，
#@d 换个 O(1) 的判断速度很划算。
#@d
#@d ============ 邻接表长什么样 ============
#@d
#@d 每个顶点挂一条链表，串着和它相邻的所有顶点：
#@d
#@d        0 → [1] → [3]
#@d        1 → [0] → [2]
#@d        2 → [1] → [3]
#@d        3 → [0] → [2]
#@d
#@d 特点：
#@d
#@d   · 空间是 O(n + e)：**有多少边就占多少空间**，稀疏图下省得多
#@d   · 判断"i 和 j 有没有边"要顺着 i 的链表找，最坏 O(n)
#@d   · 想列举"i 的所有邻居"很自然 —— 遍历链表就行
#@d
#@d 所以邻接表适合**稀疏图**（实际中的图绝大多数都是稀疏的）。
#@d
#@d ============ 怎么选 ============
#@d
#@d   稠密图、经常要判断两点是否相邻  →  邻接矩阵
#@d   稀疏图、经常要遍历某个点的邻居  →  邻接表
#@d
#@d 后面的 DFS、BFS、Dijkstra 用两种都能写。本课程统一用矩阵，
#@d 因为它写起来短、看起来直观；但要知道**工程里邻接表更常用**。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 struct 只是把字段摆好，那块地是靠 MGraph G; 在栈上占出来的；Python 写个 class，
#@d   MGraph() 一调用，矩阵格子就在 __init__ 里铺好了，没有 malloc 也没有 free。
#@d   矩阵那行要用 [[0] * MAXV for _ in range(MAXV)]，这样才是 MAXV 条各管各的列表；
#@d   写成 [[0] * MAXV] * MAXV 就是把同一条列表抄了 MAXV 遍，改一个格子会连着一列一起变。

#@s 最多多少个顶点
#@d Python 没有 #define，宏就是一个普通常量，值照抄 C 的 100。
MAXV = 100

#@s 表示"没有边"的特殊值
#@d 用一个大数而不是 0，是为了把"没有边"和"权值为 0 的边"区分开。
#@d 如果图不带权，只是 0/1，那用 0 表示无边也没问题。
INF = 65535

#@s 邻接矩阵存图
class MGraph:
    #@d C 的 struct 里直接就有 int g[MAXV][MAXV]，Python 的 class 只摆字段名，
    #@d 具体那一大块矩阵是 __init__ 里现造的。
    def __init__(self):
        #@s 顶点数
        self.nv = 0
        #@s 边数
        self.ne = 0
        #@s 矩阵：g[i][j] 为 0 表示无边，非 0 表示有边（或权值）
        #@d 一定是 [[0] * MAXV for _ in range(MAXV)]：for 每转一圈造一条新列表。
        #@d 千万别图省事写 [[0] * MAXV] * MAXV —— 那是同一条列表被引用 MAXV 次，
        #@d 图改一行，所有行跟着一起变。
        self.g = [[0] * MAXV for _ in range(MAXV)]

#@s 邻接表的边结点
#@d C 里要先 typedef 画出 struct 的样子，再 malloc 才拿到实体；
#@d Python 直接 AdjNode(3, 1) 就造好了，也没有 free 这一说。
class AdjNode:
    def __init__(self, adjv=0, weight=0):
        #@s 这个邻居的顶点编号
        self.adjv = adjv
        #@s 边的权值（无权图可以忽略）
        self.weight = weight
        #@s 下一个邻居
        #@d C 那句 struct AdjNode *next; 存的是下一个结点的地址，Python 存的是结点本身，
        #@d 没有下一个就存 None（对应 C 的 NULL）。
        self.next = None

#@s 邻接表存图
class LGraph:
    def __init__(self):
        #@s 每个顶点一条链表，head[i] 是顶点 i 的邻居链表头
        #@d C 的 AdjList head[MAXV] 是 MAXV 个指针，类型别名 AdjList 在这里用不上了：
        #@d Python 的 head 就是 MAXV 个格子，格子里要么是 AdjNode，要么是 None。
        self.head = [None] * MAXV
        #@s 顶点数
        self.nv = 0
        #@s 边数
        self.ne = 0

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 是给返回类型起个别名，Python 不看类型，这句只当记号留着。
Status = int
#%end

#%module | 02 | CreateMatrix | CreateMatrix —— 用邻接矩阵建图 | 2 | 01 |
#%summary | 先清空矩阵，再逐条边填两个格子。
#@d ============ 建图的步骤 ============
#@d
#@d   ① 把整个矩阵清零（表示"什么边都没有"）
#@d   ② 读入每一条边 (u, v)，把 g[u][v] 和 g[v][u] 都置 1
#@d
#@d 第 ② 步的两个格子都要填 —— 因为是无向图。
#@d
#@d **只填一半是最常见的错误**：图看起来能跑，但只能"从 u 走到 v"，
#@d 不能反过来走。遍历的时候会得到莫名其妙的结果。
#@d
#@d 有向图就只填 g[u][v] 一个格子，这正是有向和无向在存储上的唯一区别。
#@d
#@d ============ 顶点编号 ============
#@d
#@d 图里的顶点通常编号 0..n-1（或者 1..n）。这里统一用 0 起始，
#@d 这样可以直接当数组下标用，不用到处做 +1/-1 的转换。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的参数是 MGraph *G，函数里写 G->nv 改的就是外面那个结构体；
#@d   Python 传进去的就是那个对象本身，箭头换成点，写成 G.nv，一样改到外面。
#@d   C 的 edges 是 int edges[][2]，Python 就是一个装着元组的列表。
#@d   取法没变，还是 edges[i][0]、edges[i][1]。

#@s 用边表建一个邻接矩阵存的无向图
#@d edges 每条边两个端点，edgeCount 是边数
def CreateMatrix(G, nv, edges, edgeCount):
    #@s 记下顶点数
    G.nv = nv
    #@s 记下边数
    G.ne = edgeCount

    #@s 循环用
    #@d C 在函数开头有一行 int i, j; 提前把循环变量声明出来；Python 不用声明，
    #@d 下面的 for 自己就把 i、j 造好了，这句注释就跟着第一个 for 走。
    #@s ① 矩阵清零
    for i in range(nv):
        for j in range(nv):
            G.g[i][j] = 0

    #@s ② 逐条边填格子
    for i in range(edgeCount):
        #@s 取出两个端点
        u = edges[i][0]
        v = edges[i][1]

        #@s 无向图：两个方向都要填
        #@d 有向图这里只写 G->g[u][v] = 1 就够了。
        #@d （这句是照 C 版原话抄的；Python 里没有箭头，这一行要写成 G.g[u][v] = 1。）
        G.g[u][v] = 1
        G.g[v][u] = 1

#@s 判断 i 和 j 之间有没有边
#@d 邻接矩阵最大的优势就是这一句 —— O(1)。
#@d C 返回的是 int，不是 0 就是 1；Python 的 != 直接给 True / False，
#@d 拿去 if 判断完全一样，只是别指望打印出来是 0 和 1。
def HasEdge(G, i, j):
    #@s 直接查表
    return G.g[i][j] != 0
#%end

#%module | 03 | CreateList | CreateList —— 用邻接表建图 | 3 | 01 |
#%summary | 每个顶点一条链表，插边就是往两条链表里各插一个结点。
#@d ============ 建邻接表 ============
#@d
#@d   ① 把所有链表头置空
#@d   ② 读入边 (u, v)：在 u 的链表里插一个"v 号邻居"，在 v 的链表里插一个"u 号邻居"
#@d
#@d 又是"两个方向都要插" —— 和邻接矩阵一样。
#@d
#@d ============ 头插法 ============
#@d
#@d 插件点用**头插**（插在链表最前面），因为：
#@d
#@d   · 不用找尾，O(1) 就完成
#@d   · 链表里的顺序本来就不重要（邻居之间无先后）
#@d
#@d 代价是链表里的顺序和插边顺序**相反**。如果做题时要求输出"按编号从小到大"，
#@d 就得先收集再排序，或者改用尾插。
#@d
#@d ============ 空间对比 ============
#@d
#@d 还是 4 个顶点 4 条边的那个图：
#@d
#@d   邻接矩阵：4×4 = 16 个 int
#@d   邻接表：  4 个链表头 + 4×2 = 8 个边结点
#@d
#@d 顶点一多差距就惊人了。1000 个顶点、2000 条边：
#@d
#@d   邻接矩阵：1000×1000 = 100 万个格子
#@d   邻接表：  1000 + 4000 = 5000 个结点
#@d
#@d 差 200 倍。这就是稀疏图必须用邻接表的原因。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   边结点不用 malloc 了，AdjNode(v, w) 一调用结点就有实体了，
#@d   所以 C 里 malloc 加"分配失败就退出"那一段整块不见了，也没有 free 要还。
#@d   C 的 AdjNode *p 是"指向结点的指针"，Python 里就是一个普通变量 p，要么指着某个结点，
#@d   要么是 None；取字段一律用点，没有 -> 也没有 NULL。

#@s 在顶点 u 的链表头部插一个邻居 v
#@d 单独抽出来是因为要调用两次（u 那边一次、v 那边一次）。
def AddEdgeNode(G, u, v, w):
    #@s 造一个边结点
    #@s 分配失败要挡住
    #@s 填内容
    #@d C 的三件事 —— malloc 一块内存、挡住 NULL、逐个字段赋值 ——
    #@d Python 一句 AdjNode(v, w) 全包了：adjv 和 weight 由构造函数填好，
    #@d next 也是在那里置成 None 的。"分配失败"这条分支不用写，
    #@d Python 真分不出来会自己抛异常。
    node = AdjNode(v, w)

    #@s 头插：新结点指向原来的第一个
    node.next = G.head[u]

    #@s 链表头改成新结点
    G.head[u] = node

#@s 用边表建一个邻接表存的无向图
def CreateList(G, nv, edges, edgeCount):
    #@s 记下规模
    G.nv = nv
    G.ne = edgeCount

    #@s 循环用
    #@d C 在函数开头有一行 int i; 提前声明循环变量；Python 的 for 自己造，不用写。
    #@s ① 所有链表头置空
    for i in range(nv):
        G.head[i] = None

    #@s ② 逐条边插两个结点
    for i in range(edgeCount):
        u = edges[i][0]
        v = edges[i][1]

        #@s u 的邻居里加上 v
        AddEdgeNode(G, u, v, 1)
        #@s v 的邻居里加上 u —— 别漏
        AddEdgeNode(G, v, u, 1)

#@s 判断 i 和 j 之间有没有边
#@d 邻接表在这里比矩阵慢：要顺着链表找，最坏 O(n)。
#@d C 找到返回 1、没找到返回 0；Python 直接返回 True / False，
#@d 意思一样，拿去做条件判断也一样。
def HasEdgeList(G, i, j):
    #@s 顺着 i 的链表找
    p = G.head[i]

    while p is not None:
        #@s 找到了
        if p.adjv == j:
            return True
        #@s 下一个
        p = p.next

    #@s 找完了也没有
    return False

#@s 数一数顶点 i 有几个邻居（也就是它的度）
def DegreeOf(G, i):
    #@s 遍历计数
    p = G.head[i]
    count = 0

    while p is not None:
        count += 1
        p = p.next

    return count
#%end

#%module | 04 | PrintMatrix | PrintMatrix —— 打印邻接矩阵 | 1 | 01 |
#%summary | 按行列打印矩阵，顺便检查对称性。
#@d 打印出来看一眼，比在脑子里想有用得多。
#@d 尤其要检查两件事：**矩阵是不是对称的**、**对角线是不是 0**。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 printf("%3d", x) 是定宽打印，Python 对应写成 f'{x:3d}'，宽度都是 3。
#@d   麻烦的是 printf 不自动换行、print 会自动换行，所以凡是不想换行的地方
#@d   每句都得写 end='' —— 漏一个就变成打一个数换一行，矩阵直接散架。
#@d   还有那个三元表达式：C 写 cond ? A : B，Python 写成 A if cond else B，条件跑中间去了。

def PrintMatrix(G):
    #@s 循环用
    #@d C 在这里有一行 int i, j; 提前声明两个循环变量；Python 的 for 自己造，不用写。
    #@s 对称性检查
    symmetric = 1

    #@s 打印列号
    #@d C 是 printf("     ")，只打五个空格不换行；Python 的 print 默认会换行，
    #@d 必须补一句 end='' 才是同样的效果。
    print('     ', end='')
    for j in range(G.nv):
        print(f'{j:3d}', end='')
    print()

    #@s 逐行打印
    for i in range(G.nv):
        print(f'{i:3d} [', end='')

        for j in range(G.nv):
            print(f'{G.g[i][j]:3d}', end='')

            #@s 顺便检查对称
            if G.g[i][j] != G.g[j][i]:
                symmetric = 0
        print(' ]')

    #@s 报告对称性
    print(f'\n无向图的邻接矩阵一定对称: {"是（检查通过）" if symmetric else "不是（有问题）"}')
#%end

#%module | 05 | PrintList | PrintList —— 打印邻接表 | 1 | 01 |
#%summary | 每个顶点一行，列出它的所有邻居。
#@d 邻接表的打印顺序取决于插边顺序（因为是头插，顺序是反的）。
#@d 要按编号从小到大输出，就得先收集到一个数组里再排序。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 "%2d → " 换成 f'{i:2d} → '，后面那个箭头是原样抄过来的字符。
#@d   printf 不换行，所以这个 print 得挂 end=''；最后那句带换行的 printf
#@d   直接写成一个完整的 print 就行，\n 不用自己补。
#@d   p != NULL 换成 p is not None，p->next 换成 p.next，别的没动。

#@s 打印邻接表
def PrintList(G):
    #@s 循环用
    #@s 遍历指针
    #@d C 在这里有 int i; 和 AdjNode *p; 两行声明；Python 都不用提前声明，
    #@d i 由 for 造出来，p 到用的时候直接赋值。
    for i in range(G.nv):
        print(f'{i:2d} → ', end='')
        p = G.head[i]

        while p is not None:
            print(f'[{p.adjv}] ', end='')
            p = p.next
        print(f'(度 = {DegreeOf(G, i)})')
#%end

#%module | 06 | FreeList | FreeList —— 释放邻接表 | 1 | 01 |
#%summary | 逐条链表释放所有边结点。
#@d 每个边结点都是单独 malloc 的，要一个个放。
#@d 注意**先记住 next 再 free 当前结点** —— 顺序反了就取不到下一个了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   Python 里没有 free(p)，所以下面那句 p.next = None 不是"把内存还回去"，
#@d   只是把指向下一个结点的这根线剪断，好把"先记住下一个、再放手"的顺序演出来。
#@d   剪断之后没人再指着这些结点了，Python 自己会把它们收走，不用你操心。
#@d   其实这个函数一行不写也不会漏内存，留着就是为了和 C 版对着看。

def FreeList(G):
    #@s 循环用
    #@s 当前结点和下一个
    #@d C 在这里有 int i; 和 AdjNode *p, *q; 两行声明；Python 不用提前声明，
    #@d i 由 for 造出来，p、q 到用的时候直接赋值。
    for i in range(G.nv):
        p = G.head[i]

        while p is not None:
            #@s 先记住下一个
            q = p.next
            #@s 再释放当前
            #@d C 这里写的是 free(p)。Python 没有 free，改成把 p.next 剪断；
            #@d q 已经把下一个结点记住了，所以剪断之后还走得下去。
            p.next = None
            #@s 往后走
            p = q

        #@s 链表头置空，防止变成野指针
        #@d C 的 NULL 到 Python 就是 None；这里不会有野指针，只是"这条链表我不管了"。
        G.head[i] = None
#%end

#%module | 07 | main | main —— 两种存法摆在一起 | 2 | 01,02,03,04,05,06 |
#%summary | 同一张图，用两种方式建、两种方式打印，对比优劣。
#@d ============ 一个必须注意的细节 ============
#@d
#@d 邻接表里有 malloc，所以用完必须 FreeList。
#@d 而邻接矩阵是结构体里的一个固定数组，不用释放。
#@d
#@d 这个差别本身就说明了两种存法的性格：
#@d **矩阵是"开好一大块地，用多少算多少"；邻接表是"用多少开多少，用完要还"**。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 由系统自动调用；Python 要自己写一句 if __name__ == '__main__'，
#@d   意思是"只有直接运行这个文件才走这里，被别的文件 import 时不走"。
#@d   printf 全换成 print；C 里靠三元表达式挑"有 / 无"的地方，Python 写成
#@d   "有" if HasEdge(G, 0, 2) else "无" —— 条件和结果的位置是反的。

#@s 主函数
if __name__ == '__main__':
    #@s 图：0-1，1-2，2-3，3-0（一个正方形）
    #@d 四条边、四个顶点，刚好是个环。
    #@d C 的 static const int edges[][2] 到 Python 就是 [(0, 1), (1, 2), (2, 3), (3, 0)]，
    #@d 后面照样写 edges[i][0]、edges[i][1]，取法没变。
    edges = [(0, 1), (1, 2), (2, 3), (3, 0)]
    #@s 顶点数
    nv = 4
    #@s 边数
    ne = 4
    #@s 邻接矩阵
    #@s 邻接表
    #@d C 这两行只是在栈上声明两个变量，里面的矩阵还是脏的；
    #@d Python 的 MGraph() / LGraph() 一调用，100×100 的矩阵和 100 个空链表头就都备好了，
    #@d 所以这两句 C 代码合成下面两行。
    G = MGraph()
    L = LGraph()

    #@s 打印图的样子
    #@d C 的 printf("...\n") 换成 print('...')；最后那句原本有两个 \n，Python 这边
    #@d 写成 print('        3 ── 2\n') 才对得上，多一个空行都不能少。
    print('图：0-1，1-2，2-3，3-0')
    print('        0 ── 1')
    print('        │    │')
    print('        3 ── 2\n')

    #@s 建矩阵存法
    #@d C 传的是 &G（结构体的地址），Python 直接传 G 这个对象，函数里改的是同一个图。
    CreateMatrix(G, nv, edges, ne)
    print('=== 邻接矩阵 ===')
    PrintMatrix(G)

    #@s 建表存法
    CreateList(L, nv, edges, ne)
    print('\n=== 邻接表 ===')
    PrintList(L)

    #@s 对比两种查边的速度
    print('\n=== 查边对比 ===')
    print('查 0 和 2 有没有边：')
    print(f'  邻接矩阵 {"有" if HasEdge(G, 0, 2) else "无"}（一次数组访问）')
    print(f'  邻接表   {"有" if HasEdgeList(L, 0, 2) else "无"}（要顺着 0 的链表找）')
    print('查 0 和 1 有没有边：')
    print(f'  邻接矩阵 {"有" if HasEdge(G, 0, 1) else "无"}')
    print(f'  邻接表   {"有" if HasEdgeList(L, 0, 1) else "无"}')

    #@s 数度数
    print('\n=== 每个顶点的度 ===')
    #@s 循环用
    #@d C 在函数开头有一行 int i; 提前声明循环变量；Python 的 for 自己造，不用写，
    #@d 这句注释就跟着下面这个 for 走。
    for i in range(nv):
        print(f'  顶点 {i} 的度 = {DegreeOf(L, i)}')
    print('（无向图里每个点的度就是它邻居的个数，也就是它在链表里的结点数）')

    #@s 空间对比
    print('\n=== 空间对比 ===')
    print(f'  邻接矩阵：{nv} × {nv} = {nv * nv} 个 int')
    print(f'  邻接表  ：{nv} 个链表头 + {2 * ne} 个边结点')
    print('（顶点多了差距会非常明显：1000 个点时是 100 万 对 5000）')

    #@s 释放邻接表
    #@d 矩阵不用释放（它是结构体里的固定数组），表必须释放。
    FreeList(L)
    print('\n邻接表已释放（矩阵不用释放，它是固定数组）')

    #@s 正常结束
    #@d C 的 main 最后要写 return 0;，Python 的脚本跑完就算正常结束，不用写。
#%end
