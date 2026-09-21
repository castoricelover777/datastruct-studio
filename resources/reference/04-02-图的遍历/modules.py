#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 图本身还是邻接矩阵，遍历时要多带一个 visited 数组。
#@d ============ visited 数组是整个遍历的关键 ============
#@d
#@d 它记录"这个顶点去过没有"。两个地方都要用到：
#@d
#@d   ① **准备访问某个邻居之前**：去过就跳过，没去过才走
#@d   ② DFS 回溯的时候：标记保证不会重复回到走过的点
#@d
#@d 没有它会怎样？以那个正方形图为例，从 0 出发：
#@d
#@d   0 → 1 → 2 → 3 → 0 → 1 → 2 → 3 → 0 → ...
#@d
#@d 永远停不下来（实际会栈溢出或者死循环）。
#@d
#@d ============ 为什么用数组当队列/栈 ============
#@d
#@d 遍历时每个顶点**最多进一次**，所以容量最多就是顶点个数。
#@d 开一个 n 大小的数组，配两个下标就够了，比真的写一个栈/队列结构简单。
#@d
#@d 这也是一种常见做法：**当你能确定容量上界、又不需要复用的时候，
#@d 就地开个数组比引一个数据结构类更直接。**
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 typedef struct 只是画个样子，真正那块地是 MGraph G; 在栈上占出来的；
#@d   Python 写个 class，MGraph() 一调用，__init__ 里就把矩阵格子铺好了，也没有 malloc。
#@d   矩阵那一行必须写 [[0] * MAXV for _ in range(MAXV)]：for 每转一圈造一条新列表。
#@d   写成 [[0] * MAXV] * MAXV 就是"同一条列表被引用了 MAXV 次"，改 g[0][1] 会把
#@d   g[1][1]、g[2][1]……一起改掉，整个图就全乱了 —— 这是 Python 里很有名的一个坑。
#@d   C 的三元表达式 a > b ? a : b，Python 写成 a if a > b else b，条件跑到中间去了。

#@s 最多多少个顶点
#@d Python 没有 #define，宏就是一个普通常量，值照抄 C 的 100。
MAXV = 100

#@s 邻接矩阵存图
#@d C 的 struct 里直接就有 int g[MAXV][MAXV] 那一大块；
#@d Python 的 class 只摆字段名，矩阵是 __init__ 里现造的。
class MGraph:
    def __init__(self):
        #@s 顶点数
        self.nv = 0
        #@s 边数
        self.ne = 0
        #@s 矩阵：g[i][j] 非 0 表示 i 到 j 有边
        #@d 开的是 MAXV × MAXV（和 C 的 g[MAXV][MAXV] 一样大），
        #@d 所以后面换图、顶点数从 4 变成 7，都不用重新建矩阵。
        self.g = [[0] * MAXV for _ in range(MAXV)]

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 是给返回类型起个别名，Python 不看类型，这句只当记号留着。
Status = int

#@s 用边表建图（和 04-01 一样）
#@d 无向图，一条边要填两个格子。
def CreateGraph(G, nv, edges, edgeCount):
    #@s 循环用
    #@d C 在这里有 int i, j; 提前把两个循环变量声明出来；Python 不用声明，
    #@d 下面两个 for 自己就把 i、j 造好了。
    #@s 记规模
    G.nv = nv
    G.ne = edgeCount

    #@s 矩阵清零
    for i in range(nv):
        for j in range(nv):
            G.g[i][j] = 0

    #@s 逐条边填两个方向
    for i in range(edgeCount):
        u = edges[i][0]
        v = edges[i][1]
        G.g[u][v] = 1
        G.g[v][u] = 1

#@s 把 visited 数组清零，准备开始一次新的遍历
def ClearVisited(visited, n):
    #@s 循环清零
    #@d C 在这里有一行 int i; 提前声明循环变量；Python 的 for 自己造，不用写。
    for i in range(n):
        visited[i] = 0

#@s 两数取大
def MaxInt2(a, b):
    #@d C 的 return a > b ? a : b; Python 写成下面这样，条件和结果的位置是反的。
    return a if a > b else b

#@s 数一数图里有几条边（用来验证建图对不对）
def CountEdgesInMatrix(G):
    #@s 循环用
    #@d C 在这里有 int i, j; 提前声明两个循环变量；Python 的 for 自己造，不用写。
    #@s 计数：无向图每条边会被数到两次，所以最后要除以 2
    count = 0

    for i in range(G.nv):
        for j in range(G.nv):
            if G.g[i][j] != 0:
                count += 1

    #@s 返回边数
    #@d C 的 count / 2 是整数除法，Python 的 / 会算出小数，所以这里必须写 //。
    #@d 写成 / 的话结果是 4.0，打印出来就成了 "4.0"，和 C 的 "4" 对不上。
    return count // 2
#%end

#%module | 02 | DFS | DFS —— 深度优先（递归） | 3 | 01 |
#%summary | 一条路走到底，走不通了才回头。
#@d ============ DFS 的走法 ============
#@d
#@d 还是那个正方形图，从 0 出发，邻居按编号从小到大看：
#@d
#@d          0 ── 1
#@d          │    │
#@d          3 ── 2
#@d
#@d   访问 0，标记。它的邻居有 1 和 3，先看 1
#@d   → 访问 1，标记。邻居有 0 和 2，0 去过了，走 2
#@d   → 访问 2，标记。邻居有 1 和 3，1 去过了，走 3
#@d   → 访问 3，标记。邻居 0 和 2 都去过了，**回头**
#@d   → 回到 2：也没别的邻居了，回头
#@d   → 回到 1：也没了，回头
#@d   → 回到 0：还有一个邻居 3，但 3 已经访问过了
#@d
#@d   结果：**0 1 2 3**
#@d
#@d 注意这个顺序和"一层一层"完全无关 —— DFS 是**一路钻到底**。
#@d
#@d ============ 递归三行 ============
#@d
#@d   标记自己 → 打印自己 → 对每个没去过的邻居递归
#@d
#@d 和树的先序遍历几乎一样，只多了一个"没去过"的判断。
#@d
#@d ============ 为什么必须有 visited ============
#@d
#@d 树里不会有"绕回来"的路，所以先序遍历不用标记。
#@d 图里有环 —— 那个正方形本身就是个环。少了 visited 就会无限递归。
#@d
#@d ============ 一句话记住 DFS ============
#@d
#@d **DFS 的结果和"选择一个邻居就一路走到底"这个策略强相关。**
#@d 同一个图，如果邻居的查看顺序不同，DFS 序列会不一样。
#@d 所以题目里通常会说"按编号从小到大访问"，来固定答案。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 void DFS(MGraph *G, int v, int visited[]) 到 Python 就是 def DFS(G, v, visited)，
#@d   参数一个不多一个不少；visited 传进去的就是那个列表本身，函数里改 visited[i]
#@d   外面看得见 —— 递归能靠它防绕圈，靠的就是"大家共用一份标记"。
#@d   printf("%d ", v) 每个数后面都带一个空格（最后一个也带），Python 得写 print(v, end=' ')：
#@d   不能写 ' '.join(...)（最后少一个空格），也不能写 print(v, v2)（print 会自己插空格）。
#@d   C 函数末尾那个 } 就是"回头"的动作，Python 里就是走到函数结尾，一样的。

#@s 从顶点 v 出发做深度优先遍历
#@d visited 由调用者提供，这样多次遍历可以共享同一份标记。
def DFS(G, v, visited):
    #@s 循环用
    #@d C 在函数开头有一行 int i; 提前声明循环变量；Python 不用声明，
    #@d 下面那个 for 自己就把 i 造好了。
    #@s 标记自己已经访问
    #@d 这一句必须在最前面 —— 放在循环里的话，有环时会重复访问。
    visited[v] = 1

    #@s 访问（这里是打印）
    print(v, end=' ')

    #@s 依次检查每个邻居
    for i in range(G.nv):
        #@s 有边、且没去过 → 钻进去
        #@d 两个条件缺一不可：只看有边会绕圈，只看没去过会走到不连通的点上。
        if G.g[v][i] != 0 and visited[i] == 0:
            DFS(G, i, visited)
#@s 循环结束后函数返回，这正是"回头"的动作
#%end

#%module | 03 | DFSIter | DFSIter —— 深度优先（栈） | 3 | 01 |
#@d 递归版最好懂，但**递归深度受调用栈限制**。顶点一多可能栈溢出。
#@d 所以工程上常常改成显式的栈。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   Python 本来有现成的 list，append() 压、pop() 弹，当栈用很方便，
#@d   但这里还是照教材开一个数组、配一个 top 下标 —— 这一节的教学点就是那套下标操作。
#@d   C 的 ++top / top-- 在 Python 里没有，只能拆成两句，而且先后顺序不能写反：
#@d   stack[++top] 是"先把 top 加 1，再写 stack[top]"；stack[top--] 是"先读 stack[top]，
#@d   再把 top 减 1"。拆错了读的格子就差一格，输出会莫名其妙多一个数或者少一个数。

#%summary | 用数组当栈，把"下一步要回哪儿"明确记下来。
def DFSIter(G, v, visited):
    #@s 栈：存"待访问的顶点"
    #@d 每个顶点最多进一次栈，所以开 MAXV 个格子就够了。
    stack = [0] * MAXV
    #@s 栈顶下标
    top = -1
    #@s 当前处理的顶点
    #@s 循环用
    #@d C 在这两行注释后面还有 int u; 和 int i; 两句声明；Python 不用提前声明 ——
    #@d u 到出栈的时候直接赋值，i 由下面那个 for 自己造出来。

    #@s 起点入栈
    #@d 对应 C 的 stack[++top] = v;：先加下标，再写进去，两句顺序不能反。
    top += 1
    stack[top] = v

    #@s 栈不空就一直转
    while top >= 0:
        #@s 弹出一个
        #@d 对应 C 的 u = stack[top--];：先读 stack[top] 交给 u，再把 top 减 1。
        #@d 千万别顺手写成先 top -= 1 —— 那样读的是下面一格，整个遍历顺序全乱。
        u = stack[top]
        top -= 1

        #@s 如果已经访问过就跳过
        #@d 为什么会有重复入栈？因为邻居是"入栈时就标记得还不够早"。
        #@d 这里采用"出栈时才标记"的写法，所以要先判断。
        if visited[u] != 0:
            continue

        #@s 标记并访问
        visited[u] = 1
        print(u, end=' ')

        #@s 把没去过的邻居都压进去
        #@d 注意这里是**逆序**压栈（从大到小），因为栈是后进先出 ——
        #@d 这样弹出的时候才是从小到大，和递归版的顺序一致。
        for i in range(G.nv - 1, -1, -1):
            if G.g[u][i] != 0 and visited[i] == 0:
                #@d 又是一次 stack[++top]：还是先加下标，再写值。
                top += 1
                stack[top] = i

#@s 对比一下递归和迭代的顺序是否一致
#@d C 返回 0 或者 1，Python 返回 False / True，拿去 if 判断是一样的。
def SameOrder(a, b, n):
    #@s 循环比较
    #@d C 在这里有一行 int i; 提前声明循环变量；Python 的 for 自己造，不用写。
    for i in range(n):
        if a[i] != b[i]:
            return False
    return True
#%end

#%module | 04 | BFS | BFS —— 广度优先 | 3 | 01 |
#%summary | 先把一圈邻居看完，再往外扩一层 —— 用队列。
#@d ============ BFS 的走法 ============
#@d
#@d 还是那个正方形图，从 0 出发：
#@d
#@d          0 ── 1
#@d          │    │
#@d          3 ── 2
#@d
#@d   访问 0，把 0 入队
#@d   出队 0 → 它的邻居 1、3 都没去过 → 依次访问 1、3 并入队
#@d   出队 1 → 它的邻居 0（去过）、2（没去过）→ 访问 2 并入队
#@d   出队 3 → 邻居 0、2 都去过，什么都不做
#@d   出队 2 → 邻居都去过
#@d
#@d   结果：**0 1 3 2**
#@d
#@d 和 DFS 的 0 1 2 3 不同 —— BFS 是"一层一层"扩散的：
#@d
#@d   第 0 层：0
#@d   第 1 层：1、3     （0 的邻居）
#@d   第 2 层：2        （1 或 3 的邻居）
#@d
#@d ============ 为什么用队列 ============
#@d
#@d 因为 BFS 要求"先发现的先处理" —— 这正是队列（先进先出）的定义。
#@d
#@d 队列里存的顺序保证了：**同一层的点一定在同层的其他点之前被处理完**，
#@d 然后才轮到下一层。换成栈就变成 DFS 了。
#@d
#@d ============ 一个容易写错的细节 ============
#@d
#@d **入队的时候就要立刻标记 visited**，而不是出队的时候。
#@d
#@d 如果等到出队才标记，同一个顶点可能被它的多个邻居重复入队 ——
#@d 队列会膨胀，结果里也会出现重复。这个 bug 在小图上不明显，
#@d 图一大就暴露了。
#@d
#@d （上一模块的迭代版 DFS 用的是"出栈才标记"，那是可以的，
#@d   因为栈会去重；但队列不行，队列必须入队即标记。）
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   队列也没有换成 collections.deque，还是照教材"开一个数组 + front / rear 两个下标"，
#@d   因为这一节要讲的就是这两个下标怎么挪。
#@d   C 的 queue[rear++] = v 是"先取再加"：先写进 queue[rear]，rear 再加 1；
#@d   u = queue[front++] 也是先读 queue[front]，front 再加 1。Python 里都得拆成两句，
#@d   顺序写反就会读到空格子或者覆盖掉还没处理的元素。
#@d   printf("%d ", v) 后面那个空格不能丢，Python 这边一律写 print(..., end=' ')。

#@s 从顶点 v 出发做广度优先遍历
def BFS(G, v, visited):
    #@s 队列：就地开一个数组
    #@d 每个顶点最多入队一次，所以容量最多是顶点数。
    #@d Python 有现成的 list 和 collections.deque，用起来更省事，
    #@d 但这里保留数组队列是为了和教材对齐，好一眼对上 C 版。
    queue = [0] * MAXV
    #@s 队头下标（出队处）
    front = 0
    #@s 队尾下标（入队处）
    rear = 0
    #@s 当前处理的顶点
    #@s 循环用
    #@d C 在这两行注释后面还有 int u; 和 int i; 两句声明；Python 不用提前声明 ——
    #@d u 到出队的时候直接赋值，i 由下面那个 for 自己造出来。

    #@s 起点：标记、访问、入队
    #@d 标记和入队必须一起做，不能拖到出队时。
    visited[v] = 1
    print(v, end=' ')
    #@d 对应 C 的 queue[rear++] = v;：先写 queue[rear]，再让 rear 加 1。
    queue[rear] = v
    rear += 1

    #@s 队列不空就一直转
    while front < rear:
        #@s 出队一个
        #@d 对应 C 的 u = queue[front++];：先读 queue[front] 交给 u，再让 front 加 1。
        u = queue[front]
        front += 1

        #@s 把它的所有没去过的邻居都访问掉并入队
        for i in range(G.nv):
            if G.g[u][i] != 0 and visited[i] == 0:
                #@s 进队的同时立刻标记 —— 这里是关键
                visited[i] = 1
                #@s 访问
                print(i, end=' ')
                #@s 入队，等轮到它时再去看它的邻居
                #@d 又是 queue[rear++]：先写值，再挪 rear。
                queue[rear] = i
                rear += 1
#%end

#%module | 05 | TraverseAll | TraverseAll —— 遍历整张图 | 2 | 01,02,04 |
#%summary | 对每个没访问过的顶点各起一次遍历 —— 为了处理非连通图。
#@d ============ 为什么外面还要套一层循环 ============
#@d
#@d 前面的 DFS、BFS 都只保证"从起点能到这个连通块的所有点"。
#@d
#@d 如果图是**非连通**的，比如：
#@d
#@d       0 ── 1        2 ── 3
#@d
#@d 从 0 出发只能走到 0 和 1，2 和 3 永远访问不到。
#@d
#@d 所以遍历整张图要写成：
#@d
#@d     for (每个顶点 v)
#@d         if (v 还没访问过)
#@d             DFS(G, v, visited);
#@d
#@d 外层这个循环每进入一次 DFS，就**多发现一个连通分量**。
#@d 所以这个循环还有一个副产品：**它转了几次，图就有几个连通分量**。
#@d
#@d ============ 这个模式在别处也出现 ============
#@d
#@d 求"连通分量个数"、判断"图是否连通"、找"孤立点"，都是这个写法。
#@d 记住它：**内层负责走完一个块，外层负责发现新的块。**
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   method 这个参数两边都照抄：传 1 走 DFS，传 0 走 BFS，没有换成 True / False，
#@d   为的是和教材一格一格对上。
#@d   函数签名 def TraverseAll(G, visited, method) 和 C 的三个参数一模一样，
#@d   visited 是列表，函数里的 ClearVisited 和 DFS 改的就是外面那一份。
#@d   C 的 comp = TraverseAll(...) 里 comp 是提前声明过的 int；Python 直接接返回值就行。

#@s 遍历整张图，返回连通分量的个数
#@d method 传 1 用 DFS，传 0 用 BFS（也就是用哪种方式都行）
def TraverseAll(G, visited, method):
    #@s 循环用
    #@d C 在这里有一行 int i; 提前声明循环变量；Python 的 for 自己造，不用写。
    #@s 连通分量计数
    components = 0

    #@s 清空标记，从头开始
    ClearVisited(visited, G.nv)

    #@s 对每个顶点检查
    for i in range(G.nv):
        #@s 没访问过 → 这是一个新连通分量的起点
        if visited[i] == 0:
            #@s 分量数加一
            components += 1
            #@s 从它出发走完整个分量
            if method == 1:
                DFS(G, i, visited)
            else:
                BFS(G, i, visited)

    #@s 返回分量个数
    return components
#%end

#%module | 06 | main | main —— 两种遍历对着看 | 2 | 01,02,03,04,05 |
#%summary | 同一张图，DFS 和 BFS 给出两个不同的序列。
#@d ============ 怎么看这两个序列 ============
#@d
#@d 用那个正方形图（0-1，1-2，2-3，3-0），从 0 出发：
#@d
#@d   DFS：0 1 2 3      一路钻到底
#@d   BFS：0 1 3 2      先看一圈，再往外扩
#@d
#@d 再换一个"十字形"的图更能看出差别：
#@d
#@d          1
#@d          │
#@d      3 ─ 0 ─ 2
#@d          │
#@d          4
#@d
#@d   DFS：0 1 2 3 4    （先沿着一条路走到头）
#@d   BFS：0 1 2 3 4    （这里恰好一样，因为 0 的邻居都是叶子）
#@d
#@d 想看明显差别，得用层次深一点的图。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 由系统自动调用，Python 要自己写一句 if __name__ == '__main__'，
#@d   意思是"只有直接运行这个文件才走这里，被别的文件 import 的时候不走"。
#@d   printf 全换成 print。区别只有一个：print 自带换行，所以 C 里 printf("...\n\n")
#@d   那种两个换行的，Python 写 print('...\n')；printf("...\n") 那种就写 print('...')。
#@d   凡是 printf 只打半句、故意不换行的（比如 printf("  DFS 从 0 出发: ")），
#@d   Python 必须补 end=''，漏了那半句就先换行，后面的数字全跑到下一行去。
#@d   最后 C 要写 return 0;，Python 的脚本跑完就算正常结束，不用写。

#@s 主函数
if __name__ == '__main__':
    #@s 正方形图：0-1，1-2，2-3，3-0
    #@d C 的 static const int edges1[][2] 到 Python 就是元组列表，
    #@d 后面照样写 edges1[i][0]、edges1[i][1]，取法没变。
    edges1 = [(0, 1), (1, 2), (2, 3), (3, 0)]
    #@s 非连通图：0-1 和 2-3 两块
    edges2 = [(0, 1), (2, 3)]
    #@s 金字塔形（层次深，两种遍历差别明显）
    edges3 = [(0, 1), (0, 2), (1, 3), (1, 4), (2, 5), (2, 6)]

    #@s 图和标记数组
    #@d C 的 MGraph G; 和 int visited[MAXV]; 只是声明两个变量，里面还是脏的；
    #@d Python 的 MGraph() 一调用矩阵就铺好了，visited 直接开一个全 0 的列表。
    G = MGraph()
    visited = [0] * MAXV
    #@s 连通分量数
    #@d C 还有一行 int comp; 提前声明；Python 到用的时候直接赋值，不用声明。

    #@s 建正方形图
    CreateGraph(G, 4, edges1, 4)
    print('图一：0-1，1-2，2-3，3-0（一个环）')
    print(f'  矩阵里数出来的边数 = {CountEdgesInMatrix(G)}\n')

    #@s DFS
    ClearVisited(visited, 4)
    print('  DFS 从 0 出发: ', end='')
    DFS(G, 0, visited)
    print()

    #@s BFS
    ClearVisited(visited, 4)
    print('  BFS 从 0 出发: ', end='')
    BFS(G, 0, visited)
    print()
    print('  （DFS 一路钻到底，BFS 先看一圈邻居）\n')

    #@s 从别的点出发试试
    ClearVisited(visited, 4)
    print('  DFS 从 2 出发: ', end='')
    DFS(G, 2, visited)
    print()
    ClearVisited(visited, 4)
    print('  BFS 从 2 出发: ', end='')
    BFS(G, 2, visited)
    print()
    print('  （换个起点，序列跟着变 —— 但访问到的集合一样）\n')

    #@s 对比递归版和迭代版 DFS
    ClearVisited(visited, 4)
    print('  递归 DFS: ', end='')
    DFS(G, 0, visited)
    print()

    ClearVisited(visited, 4)
    print('  栈版 DFS: ', end='')
    DFSIter(G, 0, visited)
    print()
    print('  （两种写法结果一致 —— 逆序压栈就是为了对齐顺序）\n')

    #@s 非连通图
    CreateGraph(G, 4, edges2, 2)
    print('图二：0-1 和 2-3（两块，不连通）')
    ClearVisited(visited, 4)
    print('  只从 0 出发 DFS: ', end='')
    DFS(G, 0, visited)
    print('   ← 只走到了 0 和 1，2、3 没碰到')

    #@s 用 TraverseAll 遍历整张图
    comp = TraverseAll(G, visited, 1)
    print('\n  用 TraverseAll 遍历整张图: ', end='')
    print(f'（连通分量个数 = {comp}）')
    print('  （外层循环每进入一次 DFS，就发现一个新的连通分量）\n')

    #@s 层次深一点的图
    CreateGraph(G, 7, edges3, 6)
    print('图三：0 连 1、2；1 连 3、4；2 连 5、6（一棵二叉树形状的图）')
    ClearVisited(visited, 7)
    print('  DFS: ', end='')
    DFS(G, 0, visited)
    print()
    ClearVisited(visited, 7)
    print('  BFS: ', end='')
    BFS(G, 0, visited)
    print()
    print('  BFS 的序列是按「层」来的：0 → 1 2 → 3 4 5 6')
    print('  DFS 则是一条路走到黑')
    print('  （BFS 这个「按层输出」的性质，后面求最短路径会用到）')

#@s 正常结束
#@d C 的 main 最后要写 return 0;，Python 的脚本跑完就算正常结束，不用写。
#%end
