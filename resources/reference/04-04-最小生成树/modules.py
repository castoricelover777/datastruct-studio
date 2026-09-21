#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 图还是邻接矩阵，另外准备一个边表给 Kruskal 用。
#@d ============ 为什么要两种表示都留着 ============
#@d
#@d   Prim 要频繁地问"哪个顶点离树最近" —— 用**邻接矩阵**方便。
#@d   Kruskal 要把边排序、还要判环     —— 用**边表**方便。
#@d
#@d 所以这一节两种都定义。这不是凑数，而是算法本身决定的数据结构选择：
#@d **先想清楚算法要反复做什么，再决定用什么存。**
#@d
#@d ============ 边表长什么样 ============
#@d
#@d   每条边存三个整数：起点、终点、权值。
#@d
#@d     边表:  (0,1,6) (0,2,1) (0,3,5) (1,3,5) ...
#@d
#@d 从邻接矩阵到边表的转换要注意：**无向图每条边会被数两次**，
#@d 所以只收 u < v 的那些，避免重复。
#@d
#@d ============ Python 版怎么表达 struct ============
#@d
#@d   MGraph 和 Edge 都换成 class，字段名照抄（nv / ne / g，u / v / w）。
#@d
#@d   邻接矩阵那个二维数组有一处 Python 特有的坑：
#@d       [[0] * MAXV] * MAXV      ← 错！这是同一行被引用 MAXV 遍，
#@d                                   改一格会连着一列全变
#@d       [[0] * MAXV for _ in range(MAXV)]   ← 对，每行都是新列表
#@d   这个坑在 04-01 已经踩过一次，这里再用同样的写法。

#@s 最多顶点数
MAXV = 100

#@s 最多边数
MAXE = 1000

#@s 没有边
INF = 65535

#@s 带权图（邻接矩阵）
class MGraph:
#@s 刚建出来还没填，所以 nv / ne 先给 0
    def __init__(self):
#@s 顶点数
        self.nv = 0
#@s 边数
        self.ne = 0
#@s g[i][j] 是权值，INF 表示无边
#@d 注意不能写成 [[0]*MAXV]*MAXV —— 那样每一行都是同一个列表
        self.g = [[0] * MAXV for _ in range(MAXV)]

#@s 一条边
#@d C 这里是匿名 struct typedef，Python 直接写成一个有三个字段的类
class Edge:
#@s 造一条边时三个字段一次填好
    def __init__(self, u=0, v=0, w=0):
#@s 起点
        self.u = u
#@s 终点
        self.v = v
#@s 权值
        self.w = w

#@s 用带权边表建图
#@d C 的参数是 MGraph *G，Python 直接把 G 传进来改它的字段就行 ——
#@d 对象是按引用传的，改 G.nv / G.g 调用者看得见，不需要"二级指针"
def CreateGraph(G, nv, edges, edgeCount):
#@s 记规模
    G.nv = nv
    G.ne = edgeCount

#@s 初始化矩阵
#@d C 的三元表达式 (i == j) ? 0 : INF 在 Python 里顺序相反：
#@d 0 if i == j else INF
    for i in range(nv):
        for j in range(nv):
            G.g[i][j] = 0 if i == j else INF

#@s 填边
#@d 无向图：两个方向都要填
    for i in range(edgeCount):
        G.g[edges[i][0]][edges[i][1]] = edges[i][2]
        G.g[edges[i][1]][edges[i][0]] = edges[i][2]

#@s 从邻接矩阵抽出边表（供 Kruskal 用）
#@d 只收 u < v 的，避免同一条边收两次。
#@d C 是把结果写进出参 edges[] 再返回个数，Python 直接返回列表，更省事。
def BuildEdgeList(G):
#@s 计数
#@d C 要在这里声明 int i, j 和 count，Python 不用提前声明
    count = 0
#@s 结果边表
    edges = []

    for i in range(G.nv):
        for j in range(i + 1, G.nv):
#@s 有边就收进来
            if G.g[i][j] < INF:
                edges.append(Edge(i, j, G.g[i][j]))
                count += 1

#@s 返回边表（长度就是边数）
    return edges

#@s 把一条边打印成 "u-v(w)" 的形式
#@d C 的 printf("%d-%d(%d)") 不换行，Python 的 print 会自己换行，
#@d 所以这里也必须写 end=''，否则输出就散架了
def PrintEdge(e):
    print(f'{e.u}-{e.v}({e.w})', end='')
#%end

#%module | 02 | Prim | Prim —— 加点法 | 3 | 01 |
#%summary | 从一点出发，每次把「离树最近」的顶点加进来。
#@d ============ Prim 和 Dijkstra 长得几乎一样 ============
#@d
#@d 把两个算法的更新那一行摆在一起看：
#@d
#@d   Dijkstra:  dist[w] = dist[v] + G->g[v][w];   ← 加上"从源点过来的距离"
#@d   Prim    :  dist[w] = G->g[v][w];            ← 只看"到树的一条边"
#@d
#@d 差别就在这：Dijkstra 关心的是**从源点出发的总路程**，
#@d Prim 关心的是**这条边本身有多长**。
#@d
#@d 原因也很清楚：
#@d
#@d   · 最短路要"累计" —— 走的路越长，到终点就越远
#@d   · 生成树只看"每条边多长" —— 树的总权值是所有边相加，
#@d     所以只关心"新加进来的那条边"，不需要把前面的距离带上
#@d
#@d ============ dist 在这里是什么意思 ============
#@d
#@d Dijkstra 里 dist[w] = 源点到 w 的距离。
#@d Prim 里 dist[w] = **w 到"当前的树"最近的一条边的权值**。
#@d
#@d 所以一开始，只有起点自己和它的直连邻居有值，其余都是 INF。
#@d 每加进来一个顶点 v，就用 v 的边去更新其他还没入树的顶点。
#@d
#@d ============ 走一遍 ============
#@d
#@d 从 0 出发，dist 初值 = [0, 6, 1, 5, INF, INF]
#@d
#@d   第 1 轮：挑 dist 最小的未入树顶点 → 2（dist=1），加进来，总权值 +1
#@d            用 2 更新：2-3 权 2 < 5 → dist[3] = 2
#@d
#@d   第 2 轮：挑 → 3（dist=2），加进来，总权值 +2 = 3
#@d            用 3 更新：3-4 权 6 → dist[4]=6；3-5 权 4 → dist[5]=4
#@d
#@d   第 3 轮：挑 → 5（dist=4），总权值 3+4 = 7
#@d
#@d   第 4 轮：挑 → 1（dist=5），总权值 12
#@d
#@d   第 5 轮：挑 → 4（dist=3），总权值 15
#@d
#@d 一共加了 5 个顶点（n-1 条边），总权值 15。
#@d
#@d ============ 出参 parent 改成返回值 ============
#@d   C 的 parent[] 是出参，函数把每个顶点的父亲写进去，调用者再拿它打印树边。
#@d   Python 直接 return total, parent 两个值，调用者一次接住。
#@d   dist 和 visited 都是函数内临时用的，C 里开在栈上，Python 用列表。

#@s 从顶点 s 出发做 Prim，返回 (总权值, parent)；不连通返回 (-1, parent)
def Prim(G, s):
#@s dist[w]：w 到当前生成树最近的一条边的权值
    dist = [0] * MAXV
#@s visited[w]：w 是否已经入树
    visited = [0] * MAXV
#@s 总权值
    total = 0
#@s 记下每个点是从树里哪个点连过来的
    parent = [0] * MAXV

#@s 初始化
    for i in range(G.nv):
#@s 一开始"树"里只有 s，所以 dist 就是 s 到各点的直连边
        dist[i] = G.g[s][i]
#@s 记下每个点是从树里哪个点连过来的
        parent[i] = s
#@s 都还没入树
        visited[i] = 0

#@s 起点入树
    dist[s] = 0
    visited[s] = 1
    parent[s] = -1

#@s 还要加 n-1 个顶点
    for i in range(1, G.nv):
#@s ① 在没入树的顶点里找 dist 最小的
        v = -1
        minDist = INF

        for w in range(G.nv):
            if visited[w] == 0 and dist[w] < minDist:
                minDist = dist[w]
                v = w

#@s 找不到说明图不连通，没有生成树
        if v < 0:
            return -1, parent

#@s ② 把它加进树
        visited[v] = 1
#@s 这条边的权值计入总权值
        total += dist[v]

#@s ③ 用 v 去更新其他顶点到树的距离
        for w in range(G.nv):
#@s 没入树、且有边、且这条边比原来更短
#@d 注意这里直接就是 G.g[v][w]，不加上 dist[v] —— 这就是和 Dijkstra 的差别。
            if visited[w] == 0 and G.g[v][w] < dist[w]:
                dist[w] = G.g[v][w]
                parent[w] = v

#@s 返回总权值和 parent
    return total, parent

#@s 打印生成树的每条边（根据 parent 数组）
def PrintTreeEdges(parent, n):
    for i in range(n):
#@s 起点没有父亲
        if parent[i] < 0:
            continue
#@s 打印一条边
        print(f'  ({parent[i]}, {i})')
#%end

#%module | 03 | FindRoot | FindRoot —— 并查集：找根 | 3 | 01 |
#%summary | Kruskal 判断"加这条边会不会成环"就靠它。
#@d ============ Kruskal 为什么需要并查集 ============
#@d
#@d Kruskal 的做法是"从小到大试每条边，能加就加"。
#@d 问题是怎么判断"这条边能不能加" —— 也就是**加了会不会成环**。
#@d
#@d 一条边 (u, v) 会成环，等价于：**u 和 v 已经连通了**。
#@d 而"判断两点是否连通"正是并查集的看家本领（见 03-06）。
#@d
#@d 所以 Kruskal = 边排序 + 并查集，两个老朋友拼在一起。
#@d
#@d ============ 这里用最简版的并查集 ============
#@d
#@d 03-06 讲的是完整的并查集（负数存大小、按大小合并、路径压缩）。
#@d 这里为了不把篇幅拉太长，用简化版：
#@d
#@d     parent[i] = -1  表示 i 是根
#@d     parent[i] >= 0 表示 i 的父亲
#@d
#@d 只保留路径压缩（贡献最大的那个优化），不做按大小合并。
#@d 对 Kruskal 来说够用了 —— 因为边的数量通常不会太大。
#@d
#@d ============ 用列表当"出参" ============
#@d   C 里 parent[] 是数组，函数直接改它的元素，调用者看得见。
#@d   Python 的 list 也是可变对象，直接改元素同样传得出去 ——
#@d   所以这一组函数不用像 freeList 那样包"盒子"，
#@d   因为改的是**列表里面的元素**，不是给变量重新赋值。

#@s 找 x 所在集合的根（带路径压缩）
#@d parent[i] < 0 表示 i 是根
def FindRoot(parent, x):
#@s 自己是根
    if parent[x] < 0:
        return x
#@s 否则递归往上找，并把结果写回去（路径压缩）
#@d C 的 return parent[x] = FindRoot(...) 是"边赋值边返回"，
#@d Python 得拆成两句：先算，再存，再返回。
    parent[x] = FindRoot(parent, parent[x])
    return parent[x]

#@s 把两个集合合并
#@d 参数必须是根的下标
def UnionSets(parent, r1, r2):
#@s 随便挂：让 r2 认 r1 当父亲
#@d 简化版不做按大小合并，够用。
    parent[r2] = r1

#@s 初始化并查集
def InitSets(parent, n):
#@s 每个元素各自成组
    for i in range(n):
        parent[i] = -1
#%end

#%module | 04 | SortEdges | SortEdges —— 把边按权值排序 | 2 | 01 |
#%summary | Kruskal 的第一步：所有边从小到大排好。
#@d ============ 为什么用冒泡 ============
#@d
#@d Kruskal 的正确性不依赖排序算法好不好，随便什么排序都行。
#@d 这里用冒泡是为了**代码短、好读**，把注意力留给算法本身。
#@d
#@d 真做工程的话边数可能上万，那就该换成快排（下一章会讲）。
#@d
#@d 复杂度上，冒泡是 O(e²)，快排是 O(e log e)。e 大的时候差很多。
#@d 但 Kruskal 本身的瓶颈通常也不在这儿。
#@d
#@d ============ 为什么不用 Python 内置的 sort ============
#@d
#@d   Python 里 edges.sort(key=lambda e: e.w) 一行就排完了，比这短得多。
#@d   但这一节的教学点是**排序过程本身**，而且下一节 Kruskal 要拿排好的
#@d   顺序去加边 —— 所以这里照 C 版原样写冒泡，看得见"谁和谁比、谁和谁换"。
#@d   在 #@d 里提一句 Python 的写法，是为了让你知道有更省事的办法，
#@d   而不是说冒泡写得不对。

#@s 把边表按权值从小到大排序（冒泡）
#@d C 的参数是 Edge edges[]，数组本身会被改；Python 的 list 直接改元素就行
def SortEdges(edges, n):
    for i in range(n - 1):
        for j in range(n - 1 - i):
#@s 前面的比后面大就交换
            if edges[j].w > edges[j + 1].w:
#@d C 用一个 Edge tmp 做三步倒手。Python 其实可以一行
#@d edges[j], edges[j+1] = edges[j+1], edges[j]，
#@d 但这里照 C 写，好逐行对照。
                tmp = edges[j]
                edges[j] = edges[j + 1]
                edges[j + 1] = tmp

#@s 打印边表
def PrintEdges(edges, n):
    for i in range(n):
        print('  ', end='')
        PrintEdge(edges[i])
        print()
#%end

#%module | 05 | Kruskal | Kruskal —— 加边法 | 3 | 01,03,04 |
#%summary | 边从小到大试，不成环就加 —— 用并查集判环。
#@d ============ Kruskal 的三步 ============
#@d
#@d   ① 把所有边按权值从小到大排序
#@d   ② 依次看每条边：两端的顶点还不连通 → 加进来；已经连通 → 跳过（会成环）
#@d   ③ 加够 n-1 条就停
#@d
#@d 为什么加够 n-1 条就能停？因为 n 个顶点的树正好有 n-1 条边。
#@d 如果所有边试完还没到 n-1 条，说明图不连通。
#@d
#@d ============ 为什么先试短的边一定对 ============
#@d
#@d 这是贪心。直觉上：既然要"总权值最小"，那能用短边就用短边。
#@d
#@d 严格证明要用"割"的概念，但有个很实用的理解方式：
#@d
#@d   把边按从小到大排好之后，"最短的那条边"一定可以入选 ——
#@d   因为它不成环（图里只有它一条边时不可能成环），
#@d   而任何生成树都必须跨过它连接的那两个连通块，早晚要用一条边，
#@d   用最短的那条不会更差。
#@d
#@d 这就是 Kruskal 的核心：**每一步都在当前能选的里面挑最短的。**
#@d
#@d ============ Prim 和 Kruskal 的关系 ============
#@d
#@d 两者都是贪心，结果的总权值**一定相同**（虽然可能选出不同的边）。
#@d
#@d   看"点"贪心 → Prim，适合稠密图（O(n²)，不依赖边数）
#@d   看"边"贪心 → Kruskal，适合稀疏图（O(e log e)，只和边数有关）
#@d
#@d 所以稠密图用 Prim、稀疏图用 Kruskal —— 和邻接矩阵/邻接表的选择是一个道理。
#@d
#@d ============ 循环条件里的提前收工 ============
#@d   C 的 for 第二段是 `i < edgeCount && count < G->nv - 1`，
#@d   Python 的 for 没法写复合条件，所以改用 while：
#@d   条件里的两个判断一个都不能少，少了就变成"把所有边都试完"，
#@d   结果的权值虽然一样，但循环次数和 C 版不同。

#@s Kruskal：返回最小生成树总权值；不连通返回 -1
def Kruskal(G, edges, edgeCount):
#@s 并查集
    parent = [0] * MAXV
#@s 总权值
    total = 0
#@s 已经加了几条边
    count = 0

#@s 初始化并查集：每个顶点各自一组
    InitSets(parent, G.nv)

#@s ① 边按权值排序
    SortEdges(edges, edgeCount)

#@s ② 依次看每条边
#@d 循环条件里带 `count < G.nv - 1`，是为了"加够了就提前收工"。
    i = 0
    while i < edgeCount and count < G.nv - 1:
#@s 找两端的根
        ru = FindRoot(parent, edges[i].u)
        rv = FindRoot(parent, edges[i].v)

#@s 根相同 → 已经连通 → 这条边会成环，跳过
        if ru == rv:
            i += 1
            continue

#@s ③ 不成环 → 加进来
        UnionSets(parent, ru, rv)
        total += edges[i].w
        count += 1
#@s 下一轮看下一条边
        i += 1

#@s 边数和 n-1 对不上说明图不连通
    if count != G.nv - 1:
        return -1

#@s 返回总权值
    return total
#%end

#%module | 06 | main | main —— 两种算法对着跑 | 3 | 01,02,03,04,05 |
#%summary | 同一张图，Prim 和 Kruskal 应该给出同一个总权值。
#@d ============ 为什么要两个都算一遍 ============
#@d
#@d 因为它们是两种完全不同的思路，**结果必须一样**。
#@d
#@d 如果总权值不同，那至少有一个是错的 —— 这种"两条路互相验证"
#@d 比只看一个结果可靠得多，前面最大子列和那节也用过这一招。
#@d
#@d ============ 和 C 版的写法差别 ============
#@d
#@d   1. 边表是嵌套列表 [ [u, v, w], ... ]，不是 C 的二维数组
#@d   2. BuildEdgeList 直接返回边表，不用先开好 Edge edgeList[MAXE] 再传进去
#@d   3. Prim 返回 (总权值, parent)，不用做出参
#@d   4. 矩阵的 %5d / %5s 换成 f'{x:5d}' / f'{"INF":>5}'
#@d      （"INF" 是纯英文，按字符算宽度和 C 按字节算一样，没有对齐风险）

#@s 主函数：Python 用 if __name__ 的固定写法代替 C 的 main
if __name__ == '__main__':
#@s 带权边表：{ 起点, 终点, 权值 }
#@d 6 个顶点的一张带权图。
    edges = [
        [0, 1, 6], [0, 2, 1], [0, 3, 5],
        [1, 3, 5], [1, 4, 3],
        [2, 3, 2],
        [3, 4, 6], [3, 5, 4],
        [4, 5, 6],
    ]
#@s 边数
    edgeCount = 9
#@s 图
    G = MGraph()

#@s 建图
    CreateGraph(G, 6, edges, edgeCount)

#@s 打印邻接矩阵
    print('带权图的邻接矩阵（INF = 无边）：')
#@d C 是 printf("      ") 六个空格，Python 的 print 会补换行，所以要 end=''
    print('      ', end='')
    for i in range(G.nv):
        print(f'{i:5d}', end='')
    print()

    for i in range(G.nv):
#@d C 是 printf("  %2d [")，注意有两个前导空格和一个左方括号
        print(f'  {i:2d} [', end='')
        for j in range(G.nv):
            if G.g[i][j] >= INF:
                print(f'{"INF":>5}', end='')
            else:
                print(f'{G.g[i][j]:5d}', end='')
        print(' ]')
    print()

#@s 抽边表
    edgeList = BuildEdgeList(G)
    n = len(edgeList)
    print(f'按邻接矩阵抽出来的边表（{n} 条，只收 u<v 的避免重复）：')
    PrintEdges(edgeList, n)

#@s ==== Prim ====
    print()
    print('=== Prim（加点法）===')
    primTotal, parent = Prim(G, 0)

    if primTotal < 0:
        print('  图不连通，没有生成树')
    else:
        print('  选出的边：')
        PrintTreeEdges(parent, G.nv)
        print(f'  总权值 = {primTotal}')

#@s 重新抽一次边表（上一个算法的排序会打乱它，为了对比干净）
    edgeList = BuildEdgeList(G)
    n = len(edgeList)

#@s ==== Kruskal ====
    print()
    print('=== Kruskal（加边法）===')
    kruskalTotal = Kruskal(G, edgeList, n)

    if kruskalTotal < 0:
        print('  图不连通，没有生成树')
    else:
        print(f'  总权值 = {kruskalTotal}')

#@s 两个结果必须一致
    print()
    print('两种算法结果对比：')
    print(f'  Prim    = {primTotal}')
    print(f'  Kruskal = {kruskalTotal}')

    if primTotal == kruskalTotal:
        print('  一致 —— 两种完全不同的思路给出同一个总权值，说明都对')
    else:
        print('  不一致！至少有一个写错了')

    print()
    print('（Prim 和 Dijkstra 只差一行：')
    print('  Dijkstra 是 dist[v] + g[v][w]，Prim 是 g[v][w]）')
#@s 正常结束
#@d C 在这里 return 0。Python 的脚本不需要写返回值。
#%end
