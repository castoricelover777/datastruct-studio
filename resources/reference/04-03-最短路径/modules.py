#%module | 01 | typedef | 头文件与 typedef | 3 |
#%summary | 邻接矩阵里存权值，用一个特殊的 INF 表示"没有边"。
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 struct 只摆字段名，那块矩阵是 MGraph G; 在栈上占出来的；Python 写个 class，
#@d   MGraph() 一调用矩阵就在 __init__ 里铺好了。
#@d   建矩阵那行必须是 [[0] * n for _ in range(n)]，一行一个列表；写成 [[0] * n] * n
#@d   那是同一条列表被引用 n 遍，改一行全变 —— 这是 Python 里很有名的一个坑。
#@d   C 的 int g[MAXV][MAXV] 是定长的 100×100，本节的图只有 4 个点，
#@d   Python 这里按实际顶点数开 n 行 n 列，用多少开多少。
#@d   INF 也不换成 float('inf')，照样留 65535，这样和 C 算出来的结果能一模一样。

#@d ============ 为什么用 INF 而不是 0 ============
#@d
#@d 无权图里 0 表示"没有边"，1 表示"有边"。但带权图不行了 ——
#@d **权值本身可能是 0**（比如"免费换乘"）。如果还用 0 表示无边，
#@d 就分不清"没有这条路"和"这条路不花钱"。
#@d
#@d 所以另设一个"不可能出现的权值"当标记：
#@d
#@d     #define INF 65535
#@d
#@d 只要保证所有真实权值都远小于它就行。这样判断"有没有边"就变成
#@d `g[i][j] < INF`。
#@d
#@d 一个常见的坑：INF 取太小（比如 32767）时，**两段 INF 相加会溢出**，
#@d 变成负数，于是 `dist[v] + g[v][w] < dist[w]` 这个判断就乱了。
#@d 所以取 65535 而不是更小的值，并且做加法前先确认它确实是条边。
#@d
#@d ============ 三个数组的分工 ============
#@d
#@d   dist[w]       源点到 w 的当前最短距离（会不断变小）
#@d   collected[w]  0 表示"还没确定"，1 表示"已经确定，不会再变了"
#@d   path[w]       w 的前驱，用来从终点倒着走回起点
#@d
#@d 注意 dist 和 collected 的分工：dist 是"目前看来最短的距离"，
#@d collected 才表示"这个距离已经是最终答案了"。
#@d 一开始只有源点自己的 dist 是确定的，其余都是"待定"。

#@s 最多顶点数
MAXV = 100

#@s 表示"没有边"的权值
#@d 取一个大数，并且保证任何真实路径长度都远小于它的一半，
#@d 这样即使相加也不会溢出。
#@d Python 里其实可以直接写 float('inf') 让"无穷"变成真无穷，
#@d 但为了和 C 版逐字节对齐结果（尤其是 dist[u] + G[u][v] 这种比较的边界行为），
#@d 这里保留同样的数值 65535，不做替换。
INF = 65535

#@s 带权图的邻接矩阵
class MGraph:
    #@s 只在这里铺好字段，和这张图无关的东西一概不放
    def __init__(self):
        #@s 顶点数
        self.nv = 0
        #@s 边数
        self.ne = 0
        #@s g[i][j] 是边 i→j 的权值；等于 INF 表示没有这条边
        #@d 数组要开多大：C 里是 MAXV 的定长数组，Python 按实际顶点数来。
        #@d 这里先给空列表占位，等 CreateWeightedGraph 知道 nv 是多少了再铺矩阵。
        self.g = []

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 是给返回类型起个别名，Python 不看类型，这句只当记号留着。
Status = int

#@s 用带权边表建图
#@d edges 每条边是 { 起点, 终点, 权值 }
#@d C 的 MGraph *G 是指针，Python 传进来的就是那个对象，G->g 写成 G.g，改的是同一张图。
def CreateWeightedGraph(G, nv, edges, edgeCount):
    #@s 循环用
    #@d C 在函数开头有 int i, j; 提前把循环变量声明出来；Python 不用声明，
    #@d 下面的 for 自己就把 i、j 造好了，这句注释就跟着第一个 for 走。
    #@s 记规模
    G.nv = nv
    G.ne = edgeCount

    #@d C 的 int g[MAXV][MAXV] 建图时就在结构体里摆好了；
    #@d Python 要在这里现造：n 个点就开 n 行 n 列，一行一条列表，互不干扰。
    G.g = [[0] * nv for _ in range(nv)]

    #@s 初始化：无边的地方填 INF，对角线填 0
    #@d 对角线填 0 是"自己到自己的距离"，正好是 0，不用特判。
    for i in range(nv):
        for j in range(nv):
            #@d C 用三元表达式 (i == j) ? 0 : INF，Python 写成一模一样的写法。
            G.g[i][j] = 0 if i == j else INF

    #@s 逐条边填权值
    for i in range(edgeCount):
        u = edges[i][0]
        v = edges[i][1]
        w = edges[i][2]

        #@s 无向图两个方向都填
        G.g[u][v] = w
        G.g[v][u] = w

#@s 初始化三个数组（供 Dijkstra 使用）
#@d 单独抽出来是因为"初始化"和"算法主体"是两件不同的事，
#@d 混在一起会让主循环难读。
def InitDistPath(G, s, dist, path):
    #@s 循环用
    #@d C 在这里声明 int i; 然后一个个下标填数组；Python 的 for 自己造 i，不用声明。
    #@d C 的 dist[]、path[] 是外面传进来的数组，Python 传进来的是列表，同样是就地改。
    #@s dist 一开始只知道源点直连的那些边
    for i in range(G.nv):
        dist[i] = G.g[s][i]

        #@s path：直连的记下源点，不直连的记 -1
        #@d -1 表示"还不知道从哪儿来"。后面 PrintPath 就是靠它判断有没有到起点。
        #@d C 没有布尔类型，这个 && 只能写成 &&；Python 的 and 也是一个意思，
        #@d 判断条件一个字没改，所以 path 数组填出来和 C 完全一样。
        if G.g[s][i] < INF and i != s:
            path[i] = s
        else:
            path[i] = -1

    #@s 源点到自己是 0
    dist[s] = 0
    #@s 源点的前驱是自己（也可以理解成"没有前驱"）
    path[s] = -1
#%end

#%module | 02 | FindMinDist | FindMinDist —— 挑出最近的待定顶点 | 2 | 01 |
#%summary | 在还没收录的顶点里，找 dist 最小的那个。
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   这个函数几乎可以照抄：for i in range(G.nv) 就是 C 的 for (i = 0; i < G->nv; i++)。
#@d   唯一的差别是 !collected[i] 到了 Python 写成 collected[i] == 0 ——
#@d   Python 的 not 也能判断 0，但这里用 == 0 更像 C，谁读都不容易看岔。
#@d   返回 -1 表示"没得挑了"，这一点两版一模一样，主循环就靠这个 -1 收尾。
#@d   比较用的是**严格小于 <**，C 这边也是 <，所以 dist 打平时挑中的顶点完全一致。

#@d ============ 这个函数在做什么 ============
#@d
#@d 每轮都要问一句：**剩下的待定顶点里，谁的 dist 最小？**
#@d
#@d 挑出来的那个就可以"转正"了 —— 它的 dist 就是最终答案。
#@d
#@d 返回 -1 表示"没有待定的了"，这时候主循环就该结束。
#@d
#@d ============ 为什么不直接遍历全部顶点 ============
#@d
#@d 因为已经收录的顶点**不该再参与比较** —— 它们的 dist 已经定了，
#@d 再挑一次没有意义，还可能把已经确定的顶点又"重新确定"一遍。
#@d
#@d 所以条件是 `!collected[i] && dist[i] < minDist`，两个都要。
#@d
#@d ============ 朴素实现是 O(n) ============
#@d
#@d 一次线性扫描是 O(n)，而主循环要跑 n 轮，所以整体是 **O(n²)**。
#@d
#@d 用最小堆可以把这一步降到 O(log n)，整体变成 O(e log n) ——
#@d 这就是"堆优化的 Dijkstra"。稀疏图下快很多，但代码要长一截。
#@d 本课程用朴素版，因为思路清楚、写起来短。

#@s 返回 dist 最小的未收录顶点；都收录了返回 -1
def FindMinDist(G, dist, collected):
    #@s 纪录最小的顶点和距离
    minV = -1
    minDist = INF
    #@s 循环用
    #@d C 提前写了 int i;，Python 的 for 自带循环变量。

    for i in range(G.nv):
        #@s 只看还没收录的
        #@d 平局怎么办？这里是**严格小于**：只有发现更小的才换人，
        #@d 相等就不动。所以打平时留下的是下标小的那个，和 C 完全一致。
        if collected[i] == 0 and dist[i] < minDist:
            minDist = dist[i]
            minV = i

    #@s 返回（-1 表示没有待定的了）
    return minV

#@s 数一数图里有几条边（验证建图对不对）
def CountWeightedEdges(G):
    #@s 循环用
    #@d C 提前写了 int i, j;，Python 的两个 for 自己造。
    #@s 计数（无向图每条边数两次，最后除以 2）
    count = 0

    for i in range(G.nv):
        for j in range(G.nv):
            #@s 有边：既不是自己到自己，也不是 INF
            if i != j and G.g[i][j] < INF:
                count += 1

    #@d C 的 count / 2 是整数除法，Python 的 // 才是"除完取整"，
    #@d 写成 / 会得到浮点数，后面打印出来就多个小数点，输出就对不上了。
    return count // 2
#%end

#%module | 03 | Dijkstra | Dijkstra —— 最短路径主算法 | 3 | 01,02 |
#%summary | 每轮挑一个最近的收录，再用它松弛邻居。
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 collected[MAXV] 是定长数组，Python 开成 [0] * G.nv，实际几个点开几格。
#@d   dist 和 path 是外面传进来的列表，函数里就地改，改完调用者那边就变了，
#@d   这点和 C 传数组（传的是地址）行为一样，不用额外返回什么。
#@d   C 的 while (1) 配一个 break 退出，Python 写成 while True:，break 还是那个 break。
#@d   选点时 `<` 的写法照抄没动，所以每轮挑中哪个顶点、收录顺序都和 C 一致。

#@d ============ 用那个带权图走一遍 ============
#@d
#@d          0 ──2── 1
#@d          │       │
#@d          5       1
#@d          │       │
#@d          3 ──1── 2
#@d
#@d 从 0 出发。初始 dist 只看直连：dist = [0, 2, INF, 5]
#@d
#@d **第 1 轮**：未收录里最小的是 1（dist=2），收录它
#@d
#@d   用 1 松弛邻居：1 连 0（已收录，跳过）和 2（权 1）
#@d
#@d     绕 1 到 2 的距离 = dist[1] + 1 = 2 + 1 = 3 < INF  →  更新
#@d
#@d   dist = [0, 2, 3, 5]，path[2] = 1
#@d
#@d **第 2 轮**：未收录里最小的是 2（dist=3），收录它
#@d
#@d   用 2 松弛邻居：2 连 1（已收录）和 3（权 1）
#@d
#@d     绕 2 到 3 = 3 + 1 = 4 < 5  →  更新
#@d
#@d   dist = [0, 2, 3, 4]，path[3] = 2
#@d
#@d **第 3 轮**：未收录里最小的是 3（dist=4），收录它
#@d
#@d   3 的邻居都收录了，没有可松弛的
#@d
#@d **第 4 轮**：没有未收录的了 → 结束
#@d
#@d 最终：到 1 是 2，到 2 是 3，到 3 是 4
#@d
#@d 注意 3 的答案！一开始直连看着是 5，绕一圈反而更近（4）。
#@d 这就是"松弛"要反复做的原因 —— **第一眼看到的未必最好**。
#@d
#@d ============ 松弛这个名字 ============
#@d
#@d "松弛"（relax）的意思是：原来那个距离太"紧"了（当作最终答案），
#@d 现在发现可以更松（更短），于是放宽它。
#@d
#@d 判断只有一句：
#@d
#@d     if (dist[v] + G->g[v][w] < dist[w]) 更新
#@d
#@d 这句是整个算法的核心，其余都是围着它转的。

#@s 从源点 s 出发做 Dijkstra，结果放进 dist 和 path
def Dijkstra(G, s, dist, path):
    #@s 收录标记
    #@d C 是 int collected[MAXV]; 定长 100 格；Python 按实际顶点数开，
    #@d 4 个点就 4 格，多一格都不会有。
    collected = [0] * G.nv
    #@s 循环用
    #@d C 在函数开头有一行 int i;，还有 int v; 和 int w;，
    #@d Python 的 for 自己造循环变量，这三行声明就都省了。
    #@s 当前要收录的顶点
    #@s 邻居

    #@s 初始化三个数组
    InitDistPath(G, s, dist, path)

    #@s 一开始只有源点被收录
    #@d 源点到自己是 0，这个距离不用算，直接确定。
    for i in range(G.nv):
        collected[i] = 0
    collected[s] = 1

    #@s 主循环：每轮收录一个顶点
    #@d C 写的是 while (1)，靠里面的 break 退出；Python 的 while True: 是同一件事。
    while True:
        #@s ① 挑出未收录里 dist 最小的
        v = FindMinDist(G, dist, collected)

        #@s 没有待定的了 → 全部确定，结束
        if v < 0:
            break

        #@s ② 收录它 —— 从这一刻起，dist[v] 就是最终答案
        collected[v] = 1

        #@s ③ 用它去松弛所有邻居
        for w in range(G.nv):
            #@s 只处理：没收录的、且确实有边的
            #@d 已经收录的不用管（它的答案定了，而且更短的路早该被它自己发现）。
            if collected[w] == 0 and G.g[v][w] < INF:
                #@s 核心那一句：绕 v 过去会不会更近？
                if dist[v] + G.g[v][w] < dist[w]:
                    #@s 更近就更新距离
                    dist[w] = dist[v] + G.g[v][w]
                    #@s 并记下 w 是从 v 过来的
                    path[w] = v
#%end

#%module | 04 | PrintPath | PrintPath —— 还原路径 | 2 | 01,03 |
#%summary | 顺着 path 一路往回倒，倒到起点再正着打印。
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   写法几乎没变，就三处：if 后面多了个冒号；C 的大括号换成缩进；
#@d   printf(" → %d", v) 换成 print(f' → {v}', end='')，必须带 end=''，
#@d   不然 print 自己会换行，路径就被拆成好几行了。
#@d   递归还是递归，Python 也没给它什么特别待遇，函数里调用自己就行。

#@d ============ path 数组记的是什么 ============
#@d
#@d path[w] = v 表示"到 w 的最短路是从 v 过来的"。
#@d
#@d 所以想知道"从源点到 w 的完整路线"，就从 w 出发一路找 path：
#@d
#@d     w → path[w] → path[path[w]] → ... → 源点
#@d
#@d 走到 path 为 -1 就说明到起点了（源点的 path 是 -1）。
#@d
#@d 但这个顺序是**倒的**。要正着输出（源点 → w），有两个办法：
#@d
#@d   ① 先倒着走一遍收集到数组里，再倒着打印
#@d   ② **用递归**：先递归打印"到前驱的路径"，再打印自己
#@d
#@d 这里用 ② —— 递归天然就是"先处理更深的一层，再处理自己"，
#@d 正好把顺序翻过来，代码还短。
#@d
#@d ============ 和二叉树后序遍历的思路一样 ============
#@d
#@d "先递归、后处理自己"这个套路，在后序遍历里出现过：
#@d 先处理左右子树，再处理根。
#@d 这里也一样：先把前缀路径打完，再打自己。

#@s 递归打印从源点到 v 的路径
#@d 调用一次打印一条完整路径（含起点和终点）
def PrintPath(path, v):
    #@s path[v] >= 0 说明 v 不是起点，前面还有路
    if path[v] >= 0:
        #@s 先把前面那段打完
        #@d 这一句递归会把整条前缀都输出完，才轮到下面两行。
        PrintPath(path, path[v])

        #@s 再打自己（带个箭头）
        #@d C 的 printf(" → %d", v) 箭头前面有个空格，后面不带空格；
        #@d Python 的 print 默认自己补一个空格再补换行，所以得写
        #@d print(f' → {v}', end='')，那个 end='' 是关键，少一个空格都算错。
        print(f' → {v}', end='')
    #@s 走到起点了：它就是第一个要打印的
    else:
        print(v, end='')

#@s 打印所有顶点的最短距离和路径
def PrintAll(G, s, dist, path):
    #@s 循环用
    #@d C 提前写了 int i;，Python 的 for 自带。

    print(f'从源点 {s} 出发：')
    print('  终点   最短距离   路径')
    print('  ----   --------   ------------------')

    for i in range(G.nv):
        #@s 跳过源点自己
        if i == s:
            continue

        #@s 到不了的单独说明
        if dist[i] >= INF:
            #@d C 的格式串是 "   %2d    %8s   不可达\n"，Python 写成 f'   {i:2d}    {"—":>8}   不可达'。
            #@d %8s 是"右对齐占 8 个字符宽"，Python 的 >8 是同一条规矩；
            #@d 对不上的话那一列的破折号就会往左边跑，跟 C 差好几个空格。
            print(f'   {i:2d}    {"—":>8}   不可达')
            continue

        #@s 打印距离和路径
        #@d C 的 "   %2d    %8d   " 后面没有换行，路径要接着打在同一行，
        #@d 所以 Python 这边也写 end=''，等 PrintPath 打完了再补换行。
        print(f'   {i:2d}    {dist[i]:8d}   ', end='')
        PrintPath(path, i)
        print()
#%end

#%module | 05 | main | main —— 让 Dijkstra 跑一遍 | 3 | 01,02,03,04 |
#%summary | 在一个带权图上求单源最短路径，注意"绕远反而更近"的那个点。
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 换成 if __name__ == '__main__':，意思一样，都是"从这里开始跑"。
#@d   dist、path 在 C 里是 int dist[MAXV]; 两个定长数组，Python 按顶点数开 [0] * G.nv；
#@d   Dijkstra 就地改这两个列表，改完直接用，不用再传回来。
#@d   打印矩阵那一大段：C 靠 %6d 对齐，Python 用 f'{j:6d}' 加 end=''，一个数都不能少。
#@d   G 在 C 里是 MGraph G; 一句声明，Python 要写 G = MGraph() 才真的把对象建出来。
#@d   最后 C 要 return 0;，Python 的脚本跑完就算正常结束，不用写这句。

#@d ============ 这个例子特意留了个陷阱 ============
#@d
#@d 顶点 3 直连源点的权值是 5，一眼看去答案就是 5。
#@d 但绕 1 → 2 → 3 走一圈只要 2 + 1 + 1 = 4。
#@d
#@d 这正是 Dijkstra 要处理的情况：**初始的 dist 只是"目前已知"，不是答案**，
#@d 必须靠一轮轮松弛把它改小。
#@d
#@d 如果程序输出 5 而不是 4，说明松弛那一步写错了 ——
#@d 最常见的原因是漏了 `<` 判断，或者只更新了 dist 忘了更新 path。

#@s 主函数
if __name__ == '__main__':
    #@s 带权边表：每条边 { 起点, 终点, 权值 }
    #@d 这张图的形状：
    #@d          0 ──2── 1
    #@d          │       │
    #@d          5       1
    #@d          │       │
    #@d          3 ──1── 2
    #@d C 的 static const int edges[][3] 到 Python 就是 [[0, 1, 2], ...] 这样的嵌套列表，
    #@d 后面照样写 edges[i][0]、edges[i][1]、edges[i][2]，取法一个字没变。
    edges = [[0, 1, 2], [0, 3, 5], [1, 2, 1], [2, 3, 1]]

    #@s 图
    #@s 三个结果数组
    #@d C 这两行是 MGraph G; 加 int dist[MAXV]; int path[MAXV];，
    #@d 数组定长 100 格；Python 要等图建好、知道有几个点了，再按顶点数开。
    G = MGraph()
    #@s 源点
    s = 0
    #@s 循环用
    #@d C 在这里写了 int i, j;，Python 的两个 for 自己造循环变量。

    #@s 建图
    CreateWeightedGraph(G, 4, edges, 4)

    #@s 打印邻接矩阵
    print(f'带权图的邻接矩阵（{INF} 表示没有边）：')
    #@d C 的 printf("      "); 是 6 个空格，Python 直接打 6 个空格。
    #@d 下面这个 %6d 也没有前导空格，所以 f'{j:6d}' 里同样不加。
    print('      ', end='')
    for j in range(G.nv):
        print(f'{j:6d}', end='')
    print()

    for i in range(G.nv):
        #@d C 的 printf("  %2d [", i) 是 2 个空格 + 右对齐 2 位的 i + 空格 + 左方括号，
        #@d 结尾不能换行，矩阵还要接着打。
        print(f'  {i:2d} [', end='')
        for j in range(G.nv):
            if G.g[i][j] >= INF:
                #@d printf("%6s", "INF") 是把 INF 右对齐占 6 格；
                #@d Python 写成 f'{"INF":>6}'，效果一样。
                print(f'{"INF":>6}', end='')
            else:
                print(f'{G.g[i][j]:6d}', end='')
        print(' ]')
    #@d C 的格式串是 "（数出来的边数 = %d）\n\n"，末尾两个换行；
    #@d Python 这边用两个 print() 补第二个换行，少一个空行都会对不上。
    print(f'（数出来的边数 = {CountWeightedEdges(G)}）')
    print()

    #@s 跑 Dijkstra
    #@d 结果要放进 dist 和 path，所以这两个列表得先按顶点数开好再传进去；
    #@d C 传的是数组名（等于首地址），Python 传列表，都是就地改。
    dist = [0] * G.nv
    path = [0] * G.nv
    Dijkstra(G, s, dist, path)

    #@s 打印结果
    PrintAll(G, s, dist, path)

    #@s 重点提示
    #@d C 那两句里的「松弛」和"第一眼看到的未必最好"都是原话，
    #@d Python 这边一个字不改照抄，最后那个空行也别漏。
    print()
    print('注意顶点 3：直连源点的权值是 5，但绕 0→1→2→3 只要 4')
    print('（这就是「松弛」要反复做的原因 —— 第一眼看到的未必最好）')
    print()

    #@s 换个源点再跑一次
    #@d 换源点不用重新建图，dist 和 path 会被 Dijkstra 里的初始化整个重填，
    #@d 所以直接接着用上面那两个列表就行。
    print('=== 换个源点：从 2 出发 ===')
    Dijkstra(G, 2, dist, path)
    PrintAll(G, 2, dist, path)

    #@s 正常结束
    #@d C 的 main 在这儿 return 0;，Python 脚本跑到底就结束了，不用写这句。
#%end
