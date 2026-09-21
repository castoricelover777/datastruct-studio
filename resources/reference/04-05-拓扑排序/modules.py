#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 有向图 + 入度数组。入度就是"有多少条边指向我"。
#@d ============ 有向图和无向图的存储差别 ============
#@d
#@d 只有一个：**有向图只填一个格子**。
#@d
#@d   g[i][j] = 1  表示有一条从 i 指向 j 的边
#@d
#@d 无向图要填 g[i][j] 和 g[j][i] 两个，有向图只填一个 —— 因为方向是有意义的。
#@d
#@d 所以这个矩阵**不对称**。如果打印出来发现对称了，那说明建图时写成了无向图。
#@d
#@d ============ 入度是什么 ============
#@d
#@d 顶点 v 的**入度** = 有多少条边指向 v = **有多少个任务必须在 v 之前完成**。
#@d
#@d   · 入度 = 0  →  没有前置任务，现在就能做
#@d   · 入度 > 0  →  还有前置任务没做完
#@d
#@d 所以拓扑排序从头到尾都在盯着这个数。
#@d
#@d ============ 出度 ============
#@d
#@d 顺便说一下**出度**：有多少条边从 v 指出去。
#@d
#@d   入度 = "我要等谁"
#@d   出度 = "谁要等我"
#@d
#@d 拓扑排序主要用入度，出度在做关键路径（AOE 网）时才用得上。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 struct 只是把字段摆好，那块矩阵是 DGraph G; 在栈上占出来的；
#@d   Python 写个 class，DGraph() 一调用，__init__ 里就把矩阵格子铺好了，没有 malloc 也没有 free。
#@d   矩阵那行必须是 [[0] * MAXV for _ in range(MAXV)]：for 每转一圈造一条新列表，
#@d   写成 [[0] * MAXV] * MAXV 就是同一条列表被引用 100 遍，改一格会连着一列全变。
#@d   C 的 #define 到了 Python 就是一个普通变量，MAXV = 100 和 C 的宏一个值。
#@d   C 在函数开头写 int i, j; 提前声明循环变量；Python 不用声明，for 自己就把 i、j 造出来了。

#@s 最多顶点数
#@d Python 没有 #define，宏就是一个普通变量，值照抄 C 的 100。
MAXV = 100

#@s 有向图（邻接矩阵）
#@d C 的 struct 里直接就有 int g[MAXV][MAXV] 那一大块；
#@d Python 的 class 只摆字段名，矩阵是 __init__ 里现造的。
class DGraph:
    #@s 刚建出来还没填，所以 nv / ne 先给 0
    def __init__(self):
        #@s 顶点数
        self.nv = 0
        #@s 边数
        self.ne = 0
        #@s g[i][j] = 1 表示有一条 i → j 的边
        #@d 开的是 MAXV × MAXV（和 C 的 g[MAXV][MAXV] 一样大），所以后面换图、
        #@d 顶点数从 5 变成 3，都不用重新建矩阵。
        #@d 这里绝不能写成 [[0] * MAXV] * MAXV —— 那样每一行都是同一条列表，
        #@d g[0][2] = 1 会让 g[1][2]、g[2][2]…… 整列一起变成 1，图就全乱了。
        self.g = [[0] * MAXV for _ in range(MAXV)]

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 是给返回类型起个别名，Python 不看类型，这句只当记号留着。
Status = int

#@s 用边表建有向图
#@d edges 每条边 { 起点, 终点 }
def CreateDGraph(G, nv, edges, edgeCount):
    #@s 循环用
    #@d C 在这里有 int i, j; 提前把两个循环变量声明出来；Python 不用声明，
    #@d 下面两个 for 自己就把 i、j 造好了，这句注释就跟着第一个 for 走。
    #@s 记规模
    G.nv = nv
    G.ne = edgeCount

    #@s 清零
    for i in range(nv):
        for j in range(nv):
            G.g[i][j] = 0

    #@s 逐条边（只填一个格子！）
    #@d 这就是有向图和无向图在存储上的唯一区别。
    #@d C 的 edges[i][0] 这种取法到了 Python 一个字没变，还是两层下标。
    for i in range(edgeCount):
        G.g[edges[i][0]][edges[i][1]] = 1

#@s 计算每个顶点的入度
#@d 入度 = 第 j 列上有多少个 1。
def CalcIndegree(G, indegree):
    #@s 循环用
    #@d C 提前写了 int i, j;，Python 的 for 自带循环变量。
    #@s 先清零
    for i in range(G.nv):
        indegree[i] = 0

    #@s 逐列累加
    for i in range(G.nv):
        for j in range(G.nv):
            #@s 有一条 i→j 的边，j 的入度就加一
            if G.g[i][j] != 0:
                indegree[j] += 1

#@s 计算出度（拓扑排序用不上，但对比着看更清楚）
def OutDegree(G, v):
    #@s 第 v 行上有多少个 1
    #@d C 在这里还要写 int i; 和 int count = 0; 两行，Python 只要 count = 0。
    count = 0

    for i in range(G.nv):
        if G.g[v][i] != 0:
            count += 1
    return count
#%end

#%module | 02 | TopSort | TopSort —— 拓扑排序（Kahn 算法） | 3 | 01 |
#%summary | 每次挑一个入度为 0 的输出，然后删掉它的出边。
#@d ============ 走一遍 ============
#@d
#@d 用这张课表：
#@d
#@d      0 ──→ 2 ──→ 4
#@d      ↓           ↑
#@d      1 ──→ 3 ────┘
#@d
#@d   边：(0,2) (0,1) (1,3) (2,4) (3,4)
#@d
#@d 各点入度：0 号 0、1 号 1、2 号 1、3 号 1、4 号 2
#@d
#@d   初始队列：只有 0（唯一的入度 0）
#@d
#@d   **第 1 步**：输出 0，删掉 0 的出边
#@d        邻居是按**下标从小到大**扫的（for i in range(nv)），所以先碰到 1：
#@d        到 1 的边没了 → 1 的入度 1→0，入队
#@d        再到 2 的边没了 → 2 的入度 1→0，入队
#@d        队列 [1, 2]，已输出 0
#@d
#@d   **第 2 步**：输出 1（队列先进先出，1 比 2 先进），删掉 1 的出边
#@d        到 3 的边没了 → 3 的入度 1→0，入队
#@d        队列 [2, 3]，已输出 0 1
#@d
#@d   **第 3 步**：输出 2，删掉 2 的出边
#@d        到 4 的边没了 → 4 的入度 2→1（还不是 0）
#@d        队列 [3]，已输出 0 1 2
#@d
#@d   **第 4 步**：输出 3，删掉 3 的出边
#@d        到 4 的边没了 → 4 入度 1→0，入队
#@d        队列 [4]，已输出 0 1 2 3
#@d
#@d   **第 5 步**：输出 4，它没有出边
#@d        队列空，结束
#@d
#@d 结果：**0 1 2 3 4**
#@d
#@d 注意这里的关键：第 1 步里 1 和 2 是**同时**变成入度 0 的，
#@d 谁先输出都合法。本实现按邻居下标从小到大扫，所以 1 先进队、先输出。
#@d 换成 DFS 逆后序（本文件后面那个算法）会得到 0 2 1 3 4 —— 两个都对，
#@d 拓扑序本来就不唯一。
#@d
#@d ============ 为什么"删掉出边"就是入度减一 ============
#@d
#@d 因为入度的定义就是"有多少条边指向我"。
#@d 把某条指向我的边删掉，我的入度当然就少一。
#@d
#@d 代码里不用真的去改矩阵，只要把邻居的 indegree 减一就行 ——
#@d 这正是"用一个计数器代替真的删边"的常见技巧。
#@d
#@d ============ 注意拓扑排序不唯一 ============
#@d
#@d 如果某一时刻队列里有多个入度 0 的顶点，先输出谁都可以，
#@d 结果都是合法的。
#@d
#@d 所以做题时题目通常会规定"编号小的优先输出"，来固定答案。
#@d 我们这个实现用的是队列（先进先出），结果和入队顺序有关。
#@d
#@d ============ 为什么这里不换成 deque ============
#@d
#@d Python 的 collections.deque 有现成的 popleft()，一行就能当队列用。
#@d 这里还是照 C 的样子用数组加 front、rear 两个下标，图的是和教材对得上：
#@d 哪个顶点什么时候进队、什么时候出队，看 front、rear 这两个数就一清二楚，
#@d 换成 deque 反而看不见这个过程了。所以这一节的队列照 C 原样保留。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int queue[MAXV]; 到了 Python 就是 queue = [0] * MAXV，先开 MAXV 格。
#@d   C 的 queue[rear++] = i 一句干了两件事，Python 拆成 queue[rear] = i 和 rear += 1，
#@d   顺序是"先把 i 写进去、rear 再加一"，写反了就写到下一个格子里去了。
#@d   C 的 --indegree[i] == 0 是先把数减一再拿来比，Python 写成 indegree[i] -= 1
#@d   再 if indegree[i] == 0:，两句的顺序一样不能调。
#@d   order 数组在 C 里是外面传进来的（传的是首地址），Python 传列表也是就地改，
#@d   所以 TopSort 还是只返回个数，排好的序列调用者手里已经有。

#@s 拓扑排序，结果放进 order 数组；返回排好的顶点数
#@d 返回值 < nv 表示图里有环，拓扑序不存在
def TopSort(G, order):
    #@s 入度数组（会一边用一边减）
    indegree = [0] * MAXV
    #@s 队列：就地开数组
    #@d C 是 int queue[MAXV]; 定长 100 格，Python 写 [0] * MAXV 一样先开 100 格。
    queue = [0] * MAXV
    #@s 队头、队尾
    front = 0
    rear = 0
    #@s 已经输出了几个
    count = 0
    #@s 循环用
    #@d C 在这里还有 int i; 和 int v; 两行声明，Python 不用声明：
    #@d i 交给下面的 for 自己造，v 到循环里现赋现用。
    #@s 当前顶点

    #@s ① 先算好入度
    CalcIndegree(G, indegree)

    #@s ② 入度为 0 的全部入队
    #@d 它们是"没有前置任务"的那些，随时可以做。
    for i in range(G.nv):
        if indegree[i] == 0:
            #@d C 的 queue[rear++] = i 里，rear 是"先当下标用、用完再加一"。
            #@d Python 拆成两句：先写进 queue[rear]，再 rear += 1，顺序反了格子就错。
            queue[rear] = i
            rear += 1

    #@s ③ 队列不空就一直转
    while front < rear:
        #@s 取出一个顶点
        #@d v = queue[front++] 也是同一回事：先取 queue[front] 这个值，
        #@d 再把 front 往后挪一格。两句话的顺序不能换。
        v = queue[front]
        front += 1

        #@s 输出它
        order[count] = v
        count += 1

        #@s ④ 删掉它的所有出边 —— 也就是让邻居的入度减一
        for i in range(G.nv):
            if G.g[v][i] != 0:
                #@s 入度减一
                #@d 先减再判断，写成 --indegree[i] == 0 就是"减完正好是 0"。
                #@d C 的前置自减是"减完拿新值去比"，Python 拆成两句，先减、再比。
                indegree[i] -= 1
                if indegree[i] == 0:
                    #@s 变成 0 就说明它的前置任务都做完了，可以入队
                    queue[rear] = i
                    rear += 1

    #@s ④ 检查是不是所有顶点都输出了
    #@d 输出数少于顶点数，说明剩下的顶点入度都降不到 0 —— 它们在环上。
    return count

#@s 判断图里有没有环
#@d 判据就是"拓扑排序能不能排完所有顶点"。
def HasCycle(G):
    #@s 拓扑序
    order = [0] * MAXV
    #@s 排出来的个数
    #@d C 是 int n; 先声明、再 n = TopSort(G, order); 赋值，Python 合成一句。
    n = TopSort(G, order)

    #@s 排不满就是有环
    return n != G.nv
#%end

#%module | 03 | DFSVisit | DFSVisit —— 深度优先的辅助函数 | 3 | 01 |
#@d 这个函数是给下一个模块（DFS 版拓扑排序）用的。
#@d
#@d 它做的事就是普通的深度优先，唯一的特别之处在**最后一行**：
#@d 访问完所有邻居之后，把顶点填到 order 数组的**尾部往前**的位置上。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int *pos 是指针，Python 改不了调用者手里的那个整数，所以用 pos = [4]
#@d   这种只有一格的小列表当"盒子"，函数里写 pos[0] 就是改盒子里的数（02-02 链表用过这招）。
#@d   C 的 order[(*pos)--] = v 是"先拿 pos 指向的值当下标把 v 填进去，再把那个值减一"，
#@d   Python 必须拆成 order[pos[0]] = v 和 pos[0] -= 1 两句，顺序反过来就填错位置。
#@d   递归照样是自己调自己，写法没变，只是不用再写返回类型和参数类型。

#%summary | 深度优先遍历，回溯时把顶点从后往前填进 order。
def DFSVisit(G, v, visited, order, pos):
    #@s 循环用
    #@d C 提前写了 int i;，Python 的 for 自带循环变量。
    #@s 标记已访问
    visited[v] = 1

    #@s 先递归所有邻居
    for i in range(G.nv):
        if G.g[v][i] != 0 and visited[i] == 0:
            DFSVisit(G, i, visited, order, pos)

    #@s 邻居都处理完了，才把自己填进去
    #@d 差别就在这一句的位置 —— 放在循环**之后**就是"后序"，
    #@d 而逆后序正好就是拓扑序。
    #@d 这里是后置自减：先用 pos 现在的值当下标，用完再减一。
    #@d C 一句 order[(*pos)--] = v 写完，Python 拆成下面两句，先后顺序不能颠倒。
    order[pos[0]] = v
    pos[0] -= 1
#%end

#%module | 04 | TopSortDFS | TopSortDFS —— 拓扑排序（DFS 逆后序） | 3 | 01,03 |
#%summary | 深度优先，回溯时把顶点填进数组尾部 —— 填完倒过来就是拓扑序。
#@d ============ 为什么"逆后序"就是拓扑序 ============
#@d
#@d 先想清楚后序是什么：**在树/图的 DFS 里，一个顶点的"后序位置"
#@d 是它的所有邻居都处理完之后才确定的。**
#@d
#@d 所以如果有一条边 A → B，那么：
#@d
#@d   · 从 A 出发会先递归到 B
#@d   · B 会**先于 A** 拿到后序位置
#@d   · 也就是说：**A 的后序位置 > B 的后序位置**（A 更靠后）
#@d
#@d 那我把后序位置**反过来用**（谁后序靠后就放前面），得到的就是：
#@d
#@d   · A 排在 B 前面
#@d
#@d 正好符合"A 必须在 B 之前"！
#@d
#@d 所以在代码里，从数组**最后往前**填就行了。
#@d
#@d ============ 和 Kahn 算法的对比 ============
#@d
#@d   Kahn（入度法）：思路直观，顺序好控制，还能顺手检测环
#@d   DFS 逆后序：   代码更短，不用算入度，但顺序不好控制
#@d
#@d 两者都能用。考试里 Kahn 更常见，因为它"看得见过程"。
#@d
#@d 注意：DFS 版**不能直接用来检测环**，它照样能输出一个序列 ——
#@d 只是有环时那个序列没有意义。要检测环得另外做标记（三种颜色）。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int visited[MAXV]; 换成 visited = [0] * MAXV，还是先开 100 格。
#@d   C 的 &pos 是取地址，Python 用 pos = [G.nv - 1] 这个一格的小列表当"盒子"，
#@d   传给 DFSVisit 的是盒子本身，函数里 pos[0] -= 1 调用者这边看得见。
#@d   C 的 return G->nv; 照抄成 return G.nv，函数签名里的类型全都不用写了。
#@d   PrintOrder 里的 printf("%d ", x) 每个数后面都有一个空格（最后一个也有），
#@d   Python 得逐个 print(order[i], end=' ')，写成 ' '.join() 会少最后一个空格，对不上。

#@s 用 DFS 逆后序做拓扑排序
#@d 返回排好的顶点数（这里总是 nv，不检测环）
def TopSortDFS(G, order):
    #@s 访问标记
    visited = [0] * MAXV
    #@s 填充位置（从最后一个位置开始往前）
    #@s 循环用
    #@d C 在开头写了 int pos; 和 int i; 两行，pos 是后面才赋值的；
    #@d Python 不用提前声明，i 由 for 自己造，pos 到该用的时候才建出来。

    #@s 都还没访问
    for i in range(G.nv):
        visited[i] = 0

    #@s 从末尾往前填
    #@d C 的 pos 是 int，Python 用只有一个元素的列表当盒子，所以写成 [G.nv - 1]。
    pos = [G.nv - 1]

    #@s 每个没访问过的顶点都起一次 DFS
    #@d 外层这个循环是为了处理"非连通"的有向图。
    for i in range(G.nv):
        if visited[i] == 0:
            DFSVisit(G, i, visited, order, pos)

    #@s 全部填满
    return G.nv

#@s 打印一个序列
def PrintOrder(tag, order, n):
    #@s 循环用
    #@d C 提前写了 int i;，Python 的 for 自带。

    #@d C 的 printf("%s", tag) 不换行，Python 要写 print(tag, end='') 才是同一个效果，
    #@d 少了 end='' 就会先把 tag 单独打一行，整个输出就散了。
    print(tag, end='')
    for i in range(n):
        #@d printf("%d ", order[i]) 是"数字 + 一个空格"，最后一个数后面也有空格；
        #@d 所以这里逐个数打印、每个都带 end=' '，不能换成 ' '.join(...)。
        print(order[i], end=' ')
    print()
#%end

#%module | 05 | main | main —— 两种做法对着看 | 3 | 01,02,03,04 |
#%summary | 同一个 AOV 网，Kahn 和 DFS 逆后序给出两个合法的顺序。
#@d ============ 序列不一样，但都对 ============
#@d
#@d 拓扑排序不唯一。只要每条边都"从前往后"，就是合法答案。
#@d
#@d 所以两个算法给出不同的序列是**正常现象**，不用去对答案。
#@d 真正该检查的是：**结果里每条边的方向对不对**。
#@d
#@d 验证办法：记下每个顶点在结果里的位置，然后遍历所有边，
#@d 检查是不是"起点的位置 < 终点的位置"。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 换成 if __name__ == '__main__':，意思一样，都是"从这里开始跑"。
#@d   order1、order2、indegree 在 C 里是 int x[MAXV]; 定长数组，Python 写成 [0] * MAXV。
#@d   打印矩阵把 %3d、%2d 换成 f'{x:3d}'、f'{x:2d}'，都要带 end=''，少一个空格就对不上。
#@d   C 最后 return 0;，Python 脚本跑到底就算正常结束，这句不用写。

#@s 检查一个序列是不是合法拓扑序
#@d 返回 1 表示合法
def CheckOrder(G, order):
    #@s 每个顶点在序列里的位置
    pos = [0] * MAXV
    #@s 循环用
    #@d C 提前写了 int i, j;，Python 的两个 for 自己造循环变量。

    #@s 先记下位置
    for i in range(G.nv):
        pos[order[i]] = i

    #@s 检查每条边
    for i in range(G.nv):
        for j in range(G.nv):
            #@s 有边 i→j，那 i 必须排在 j 前面
            #@d C 的 printf 里四个 %d 传的是 (i, j, i, j)，Python 的 f-string 照着填。
            if G.g[i][j] != 0 and pos[i] >= pos[j]:
                print(f'  违反：边 {i}→{j}，但 {i} 排在 {j} 后面')
                return 0
    return 1

#@s 主函数
if __name__ == '__main__':
    #@s 课表：{ 先修课, 后续课 }
    #@d   0 → 2 → 4
    #@d   ↓       ↑
    #@d   1 → 3 ──┘
    #@d C 的 static const int edges[][2] 到 Python 就是 [[0, 2], [0, 1], ...] 这种嵌套列表，
    #@d 后面照样写 edges[i][0]、edges[i][1]，取法一个字没变。
    edges = [[0, 2], [0, 1], [1, 3], [2, 4], [3, 4]]
    #@s 顶点数、边数
    #@d C 这里是 int nv = 5;，Python 就一句赋值，不用写类型。
    nv = 5
    #@s 图
    #@d C 的 DGraph G; 只是在栈上摆了个架子，Python 要写 G = DGraph() 才真把对象建出来。
    G = DGraph()
    #@s 两个算法的结果
    #@d 这两个数组是当"出参"用的，C 传数组名（等于首地址），Python 传列表，都是就地改。
    order1 = [0] * MAXV
    order2 = [0] * MAXV
    #@s 排序结果的长度
    #@s 入度数组
    #@s 循环用
    #@d C 写了 int n1, n2; 和 int indegree[MAXV]; 还有 int i, j;，
    #@d Python 这边数组按 MAXV 先开好，n1、n2 到用的时候再赋值，i、j 交给 for 自己造。

    #@s 建图
    CreateDGraph(G, nv, edges, 5)

    #@s 打印邻接矩阵
    print('有向图的邻接矩阵（g[i][j]=1 表示 i→j）：')
    #@d C 的 printf("      ") 是 6 个空格，Python 直接打 6 个空格，末尾不换行。
    print('      ', end='')
    for j in range(nv):
        print(f'{j:3d}', end='')
    print()

    for i in range(nv):
        #@d C 的 printf("  %2d [", i) 是 2 个空格 + 右对齐 2 位的 i + 空格 + 左方括号。
        print(f'  {i:2d} [', end='')
        for j in range(nv):
            print(f'{G.g[i][j]:3d}', end='')
        print(' ]')
    #@d C 的格式串末尾是 \n\n，Python 用两个 print 补出那个空行。
    print('（注意矩阵不对称 —— 有向图只填一个格子）')
    print()

    #@s 打印入度出度
    indegree = [0] * MAXV
    CalcIndegree(G, indegree)
    print('各顶点的入度和出度：')
    for i in range(nv):
        #@d C 是 printf("  顶点 %d：入度 = %d，出度 = %d\n", ...)，
        #@d 逗号、全角冒号全都要照抄，Python 用一条 f-string 拼出来。
        print(f'  顶点 {i}：入度 = {indegree[i]}，出度 = {OutDegree(G, i)}')
    print('（入度 = 我要等谁，出度 = 谁要等我）')
    print()

    #@s Kahn 算法
    n1 = TopSort(G, order1)
    print('=== Kahn 算法（入度 + 队列）===')
    PrintOrder('  结果: ', order1, n1)
    print(f'  排出了 {n1} / {nv} 个顶点')
    if n1 == nv:
        #@d C 的三元表达式 cond ? "A" : "B" 到 Python 写成 "A" if cond else "B"，
        #@d 条件跑到中间去了，选出来的字符串和 C 一模一样。
        print(f'  检查合法性: {"每条边都是从前往后，合法" if CheckOrder(G, order1) else "不合法"}')

    #@s DFS 逆后序
    n2 = TopSortDFS(G, order2)
    #@d C 的 printf("\n=== DFS 逆后序 ===\n") 前面有一个换行，Python 先用一个 print() 补上。
    print()
    print('=== DFS 逆后序 ===')
    PrintOrder('  结果: ', order2, n2)
    print(f'  检查合法性: {"每条边都是从前往后，合法" if CheckOrder(G, order2) else "不合法"}')

    #@s 说明
    print()
    print('两个序列不一样，但都合法 —— 拓扑排序不唯一')
    print('（队列里有多个入度 0 的点时，先输出谁都可以）')
    print()

    #@s 有环的情况
    #@d C 这里用一对大括号 {} 划了个局部作用域，Python 没有这种块，
    #@d 靠缩进分层就行；图变量在 C 里就叫 C（cyclic 的那个 C），Python 照样叫 C，不是笔误。
    #@s 一个三角形：0→1→2→0
    cyc = [[0, 1], [1, 2], [2, 0]]
    C = DGraph()
    order = [0] * MAXV
    n = TopSort(C, order)

    print('=== 有环的情况：0→1→2→0 ===')
    print(f'  排出了 {n} / 3 个顶点')
    print(f'  有环: {"是" if n != 3 else "不是"}')
    print('  为什么？环上每个顶点的入度都是 1，谁也降不到 0，')
    print('  所以一个都进不了队 —— 队列一直是空的')
    print('  **输出顶点数 < n  就等价于  有环**')

    #@s 正常结束
    #@d C 的 main 在这儿 return 0;，Python 脚本跑到底就结束了，不用写这句。
#%end
