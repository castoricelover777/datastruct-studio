/*
 * ============================================================================
 *  数据结构研习社 —— 04 图 / 04-02 图的遍历
 * ============================================================================
 *
 *  树的遍历很轻松：从根出发，每个结点只有一条路能到，走不回头。
 *  图的遍历多了一个麻烦：**路会绕回来**。
 *
 *          0 ── 1
 *          │    │
 *          3 ── 2
 *
 *  从 0 出发往右走到 1、再往下到 2、再往左到 3，然后 3 又连着 0 ——
 *  要是不做标记，程序就绕圈绕到天荒地老。
 *
 *  所以图的遍历必须配一个 **visited 数组**：
 *
 *      visited[i] = 0  还没去过
 *      visited[i] = 1  去过了
 *
 *  两种走法的区别只在"下一步先看谁"：
 *
 *      **DFS 深度优先**：一条路走到底，走不通了才回头   →  用递归（或者栈）
 *      **BFS 广度优先**：先把一圈邻居都看完，再往外扩一层 →  用队列
 *
 *  标记约定同前（本文件本身可编译）。
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>

//%module | 01 | typedef | 头文件与 typedef | 2 |
//%summary | 图本身还是邻接矩阵，遍历时要多带一个 visited 数组。
//@d ============ visited 数组是整个遍历的关键 ============
//@d
//@d 它记录"这个顶点去过没有"。两个地方都要用到：
//@d
//@d   ① **准备访问某个邻居之前**：去过就跳过，没去过才走
//@d   ② DFS 回溯的时候：标记保证不会重复回到走过的点
//@d
//@d 没有它会怎样？以那个正方形图为例，从 0 出发：
//@d
//@d   0 → 1 → 2 → 3 → 0 → 1 → 2 → 3 → 0 → ...
//@d
//@d 永远停不下来（实际会栈溢出或者死循环）。
//@d
//@d ============ 为什么用数组当队列/栈 ============
//@d
//@d 遍历时每个顶点**最多进一次**，所以容量最多就是顶点个数。
//@d 开一个 n 大小的数组，配两个下标就够了，比真的写一个栈/队列结构简单。
//@d
//@d 这也是一种常见做法：**当你能确定容量上界、又不需要复用的时候，
//@d 就地开个数组比引一个数据结构类更直接。**

//@s 最多多少个顶点
#define MAXV 100

//@s 邻接矩阵存图
typedef struct
{
//@s 顶点数
    int nv;
//@s 边数
    int ne;
//@s 矩阵：g[i][j] 非 0 表示 i 到 j 有边
    int g[MAXV][MAXV];
} MGraph;

//@s 状态码
#define OK 1
#define ERROR 0
typedef int Status;

//@s 用边表建图（和 04-01 一样）
//@d 无向图，一条边要填两个格子。
void CreateGraph(MGraph *G, int nv, const int edges[][2], int edgeCount)
{
//@s 循环用
    int i, j;

//@s 记规模
    G->nv = nv;
    G->ne = edgeCount;

//@s 矩阵清零
    for (i = 0; i < nv; i++)
    {
        for (j = 0; j < nv; j++)
        {
            G->g[i][j] = 0;
        }
    }

//@s 逐条边填两个方向
    for (i = 0; i < edgeCount; i++)
    {
        int u = edges[i][0];
        int v = edges[i][1];
        G->g[u][v] = 1;
        G->g[v][u] = 1;
    }
}

//@s 把 visited 数组清零，准备开始一次新的遍历
void ClearVisited(int visited[], int n)
{
//@s 循环清零
    int i;

    for (i = 0; i < n; i++)
    {
        visited[i] = 0;
    }
}

//@s 两数取大
int MaxInt2(int a, int b)
{
    return a > b ? a : b;
}

//@s 数一数图里有几条边（用来验证建图对不对）
int CountEdgesInMatrix(MGraph *G)
{
//@s 循环用
    int i, j;
//@s 计数：无向图每条边会被数到两次，所以最后要除以 2
    int count = 0;

    for (i = 0; i < G->nv; i++)
    {
        for (j = 0; j < G->nv; j++)
        {
            if (G->g[i][j] != 0)
            {
                count++;
            }
        }
    }

//@s 返回边数
    return count / 2;
}
//%end

//%module | 02 | DFS | DFS —— 深度优先（递归） | 3 | 01 |
//%summary | 一条路走到底，走不通了才回头。
//@d ============ DFS 的走法 ============
//@d
//@d 还是那个正方形图，从 0 出发，邻居按编号从小到大看：
//@d
//@d          0 ── 1
//@d          │    │
//@d          3 ── 2
//@d
//@d   访问 0，标记。它的邻居有 1 和 3，先看 1
//@d   → 访问 1，标记。邻居有 0 和 2，0 去过了，走 2
//@d   → 访问 2，标记。邻居有 1 和 3，1 去过了，走 3
//@d   → 访问 3，标记。邻居 0 和 2 都去过了，**回头**
//@d   → 回到 2：也没别的邻居了，回头
//@d   → 回到 1：也没了，回头
//@d   → 回到 0：还有一个邻居 3，但 3 已经访问过了
//@d
//@d   结果：**0 1 2 3**
//@d
//@d 注意这个顺序和"一层一层"完全无关 —— DFS 是**一路钻到底**。
//@d
//@d ============ 递归三行 ============
//@d
//@d   标记自己 → 打印自己 → 对每个没去过的邻居递归
//@d
//@d 和树的先序遍历几乎一样，只多了一个"没去过"的判断。
//@d
//@d ============ 为什么必须有 visited ============
//@d
//@d 树里不会有"绕回来"的路，所以先序遍历不用标记。
//@d 图里有环 —— 那个正方形本身就是个环。少了 visited 就会无限递归。
//@d
//@d ============ 一句话记住 DFS ============
//@d
//@d **DFS 的结果和"选择一个邻居就一路走到底"这个策略强相关。**
//@d 同一个图，如果邻居的查看顺序不同，DFS 序列会不一样。
//@d 所以题目里通常会说"按编号从小到大访问"，来固定答案。

//@s 从顶点 v 出发做深度优先遍历
//@d visited 由调用者提供，这样多次遍历可以共享同一份标记。
void DFS(MGraph *G, int v, int visited[])
{
//@s 循环用
    int i;

//@s 标记自己已经访问
//@d 这一句必须在最前面 —— 放在循环里的话，有环时会重复访问。
    visited[v] = 1;

//@s 访问（这里是打印）
    printf("%d ", v);

//@s 依次检查每个邻居
    for (i = 0; i < G->nv; i++)
    {
//@s 有边、且没去过 → 钻进去
//@d 两个条件缺一不可：只看有边会绕圈，只看没去过会走到不连通的点上。
        if (G->g[v][i] != 0 && visited[i] == 0)
        {
            DFS(G, i, visited);
        }
    }
//@s 循环结束后函数返回，这正是"回头"的动作
}
//%end

//%module | 03 | DFSIter | DFSIter —— 深度优先（栈） | 3 | 01 |
//@d 递归版最好懂，但**递归深度受调用栈限制**。顶点一多可能栈溢出。
//@d 所以工程上常常改成显式的栈。

//%summary | 用数组当栈，把"下一步要回哪儿"明确记下来。
void DFSIter(MGraph *G, int v, int visited[])
{
//@s 栈：存"待访问的顶点"
    int stack[MAXV];
//@s 栈顶下标
    int top = -1;
//@s 当前处理的顶点
    int u;
//@s 循环用
    int i;

//@s 起点入栈
    stack[++top] = v;

//@s 栈不空就一直转
    while (top >= 0)
    {
//@s 弹出一个
        u = stack[top--];

//@s 如果已经访问过就跳过
//@d 为什么会有重复入栈？因为邻居是"入栈时就标记得还不够早"。
//@d 这里采用"出栈时才标记"的写法，所以要先判断。
        if (visited[u] != 0)
        {
            continue;
        }

//@s 标记并访问
        visited[u] = 1;
        printf("%d ", u);

//@s 把没去过的邻居都压进去
//@d 注意这里是**逆序**压栈（从大到小），因为栈是后进先出 ——
//@d 这样弹出的时候才是从小到大，和递归版的顺序一致。
        for (i = G->nv - 1; i >= 0; i--)
        {
            if (G->g[u][i] != 0 && visited[i] == 0)
            {
                stack[++top] = i;
            }
        }
    }
}

//@s 对比一下递归和迭代的顺序是否一致
int SameOrder(const int a[], const int b[], int n)
{
//@s 循环比较
    int i;

    for (i = 0; i < n; i++)
    {
        if (a[i] != b[i])
        {
            return 0;
        }
    }
    return 1;
}
//%end

//%module | 04 | BFS | BFS —— 广度优先 | 3 | 01 |
//%summary | 先把一圈邻居看完，再往外扩一层 —— 用队列。
//@d ============ BFS 的走法 ============
//@d
//@d 还是那个正方形图，从 0 出发：
//@d
//@d          0 ── 1
//@d          │    │
//@d          3 ── 2
//@d
//@d   访问 0，把 0 入队
//@d   出队 0 → 它的邻居 1、3 都没去过 → 依次访问 1、3 并入队
//@d   出队 1 → 它的邻居 0（去过）、2（没去过）→ 访问 2 并入队
//@d   出队 3 → 邻居 0、2 都去过，什么都不做
//@d   出队 2 → 邻居都去过
//@d
//@d   结果：**0 1 3 2**
//@d
//@d 和 DFS 的 0 1 2 3 不同 —— BFS 是"一层一层"扩散的：
//@d
//@d   第 0 层：0
//@d   第 1 层：1、3     （0 的邻居）
//@d   第 2 层：2        （1 或 3 的邻居）
//@d
//@d ============ 为什么用队列 ============
//@d
//@d 因为 BFS 要求"先发现的先处理" —— 这正是队列（先进先出）的定义。
//@d
//@d 队列里存的顺序保证了：**同一层的点一定在同层的其他点之前被处理完**，
//@d 然后才轮到下一层。换成栈就变成 DFS 了。
//@d
//@d ============ 一个容易写错的细节 ============
//@d
//@d **入队的时候就要立刻标记 visited**，而不是出队的时候。
//@d
//@d 如果等到出队才标记，同一个顶点可能被它的多个邻居重复入队 ——
//@d 队列会膨胀，结果里也会出现重复。这个 bug 在小图上不明显，
//@d 图一大就暴露了。
//@d
//@d （上一模块的迭代版 DFS 用的是"出栈才标记"，那是可以的，
//@d   因为栈会去重；但队列不行，队列必须入队即标记。）

//@s 从顶点 v 出发做广度优先遍历
void BFS(MGraph *G, int v, int visited[])
{
//@s 队列：就地开一个数组
//@d 每个顶点最多入队一次，所以容量最多是顶点数。
    int queue[MAXV];
//@s 队头下标（出队处）
    int front = 0;
//@s 队尾下标（入队处）
    int rear = 0;
//@s 当前处理的顶点
    int u;
//@s 循环用
    int i;

//@s 起点：标记、访问、入队
//@d 标记和入队必须一起做，不能拖到出队时。
    visited[v] = 1;
    printf("%d ", v);
    queue[rear++] = v;

//@s 队列不空就一直转
    while (front < rear)
    {
//@s 出队一个
        u = queue[front++];

//@s 把它的所有没去过的邻居都访问掉并入队
        for (i = 0; i < G->nv; i++)
        {
            if (G->g[u][i] != 0 && visited[i] == 0)
            {
//@s 进队的同时立刻标记 —— 这里是关键
                visited[i] = 1;
//@s 访问
                printf("%d ", i);
//@s 入队，等轮到它时再去看它的邻居
                queue[rear++] = i;
            }
        }
    }
}
//%end

//%module | 05 | TraverseAll | TraverseAll —— 遍历整张图 | 2 | 01,02,04 |
//%summary | 对每个没访问过的顶点各起一次遍历 —— 为了处理非连通图。
//@d ============ 为什么外面还要套一层循环 ============
//@d
//@d 前面的 DFS、BFS 都只保证"从起点能到这个连通块的所有点"。
//@d
//@d 如果图是**非连通**的，比如：
//@d
//@d       0 ── 1        2 ── 3
//@d
//@d 从 0 出发只能走到 0 和 1，2 和 3 永远访问不到。
//@d
//@d 所以遍历整张图要写成：
//@d
//@d     for (每个顶点 v)
//@d         if (v 还没访问过)
//@d             DFS(G, v, visited);
//@d
//@d 外层这个循环每进入一次 DFS，就**多发现一个连通分量**。
//@d 所以这个循环还有一个副产品：**它转了几次，图就有几个连通分量**。
//@d
//@d ============ 这个模式在别处也出现 ============
//@d
//@d 求"连通分量个数"、判断"图是否连通"、找"孤立点"，都是这个写法。
//@d 记住它：**内层负责走完一个块，外层负责发现新的块。**

//@s 遍历整张图，返回连通分量的个数
//@d method 传 1 用 DFS，传 0 用 BFS（也就是用哪种方式都行）
int TraverseAll(MGraph *G, int visited[], int method)
{
//@s 循环用
    int i;
//@s 连通分量计数
    int components = 0;

//@s 清空标记，从头开始
    ClearVisited(visited, G->nv);

//@s 对每个顶点检查
    for (i = 0; i < G->nv; i++)
    {
//@s 没访问过 → 这是一个新连通分量的起点
        if (visited[i] == 0)
        {
//@s 分量数加一
            components++;
//@s 从它出发走完整个分量
            if (method == 1)
            {
                DFS(G, i, visited);
            }
            else
            {
                BFS(G, i, visited);
            }
        }
    }

//@s 返回分量个数
    return components;
}
//%end

//%module | 06 | main | main —— 两种遍历对着看 | 2 | 01,02,03,04,05 |
//%summary | 同一张图，DFS 和 BFS 给出两个不同的序列。
//@d ============ 怎么看这两个序列 ============
//@d
//@d 用那个正方形图（0-1，1-2，2-3，3-0），从 0 出发：
//@d
//@d   DFS：0 1 2 3      一路钻到底
//@d   BFS：0 1 3 2      先看一圈，再往外扩
//@d
//@d 再换一个"十字形"的图更能看出差别：
//@d
//@d          1
//@d          │
//@d      3 ─ 0 ─ 2
//@d          │
//@d          4
//@d
//@d   DFS：0 1 2 3 4    （先沿着一条路走到头）
//@d   BFS：0 1 2 3 4    （这里恰好一样，因为 0 的邻居都是叶子）
//@d
//@d 想看明显差别，得用层次深一点的图。

//@s 主函数
int main(void)
{
//@s 正方形图：0-1，1-2，2-3，3-0
    static const int edges1[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
//@s 非连通图：0-1 和 2-3 两块
    static const int edges2[][2] = { { 0, 1 }, { 2, 3 } };
//@s 金字塔形（层次深，两种遍历差别明显）
    static const int edges3[][2] = { { 0, 1 }, { 0, 2 }, { 1, 3 }, { 1, 4 }, { 2, 5 }, { 2, 6 } };

//@s 图和标记数组
    MGraph G;
    int visited[MAXV];
//@s 连通分量数
    int comp;

//@s 建正方形图
    CreateGraph(&G, 4, edges1, 4);
    printf("图一：0-1，1-2，2-3，3-0（一个环）\n");
    printf("  矩阵里数出来的边数 = %d\n\n", CountEdgesInMatrix(&G));

//@s DFS
    ClearVisited(visited, 4);
    printf("  DFS 从 0 出发: ");
    DFS(&G, 0, visited);
    printf("\n");

//@s BFS
    ClearVisited(visited, 4);
    printf("  BFS 从 0 出发: ");
    BFS(&G, 0, visited);
    printf("\n");
    printf("  （DFS 一路钻到底，BFS 先看一圈邻居）\n\n");

//@s 从别的点出发试试
    ClearVisited(visited, 4);
    printf("  DFS 从 2 出发: ");
    DFS(&G, 2, visited);
    printf("\n");
    ClearVisited(visited, 4);
    printf("  BFS 从 2 出发: ");
    BFS(&G, 2, visited);
    printf("\n");
    printf("  （换个起点，序列跟着变 —— 但访问到的集合一样）\n\n");

//@s 对比递归版和迭代版 DFS
    ClearVisited(visited, 4);
    printf("  递归 DFS: ");
    DFS(&G, 0, visited);
    printf("\n");

    ClearVisited(visited, 4);
    printf("  栈版 DFS: ");
    DFSIter(&G, 0, visited);
    printf("\n");
    printf("  （两种写法结果一致 —— 逆序压栈就是为了对齐顺序）\n\n");

//@s 非连通图
    CreateGraph(&G, 4, edges2, 2);
    printf("图二：0-1 和 2-3（两块，不连通）\n");
    ClearVisited(visited, 4);
    printf("  只从 0 出发 DFS: ");
    DFS(&G, 0, visited);
    printf("   ← 只走到了 0 和 1，2、3 没碰到\n");

//@s 用 TraverseAll 遍历整张图
    comp = TraverseAll(&G, visited, 1);
    printf("\n  用 TraverseAll 遍历整张图: ");
    printf("（连通分量个数 = %d）\n", comp);
    printf("  （外层循环每进入一次 DFS，就发现一个新的连通分量）\n\n");

//@s 层次深一点的图
    CreateGraph(&G, 7, edges3, 6);
    printf("图三：0 连 1、2；1 连 3、4；2 连 5、6（一棵二叉树形状的图）\n");
    ClearVisited(visited, 7);
    printf("  DFS: ");
    DFS(&G, 0, visited);
    printf("\n");
    ClearVisited(visited, 7);
    printf("  BFS: ");
    BFS(&G, 0, visited);
    printf("\n");
    printf("  BFS 的序列是按「层」来的：0 → 1 2 → 3 4 5 6\n");
    printf("  DFS 则是一条路走到黑\n");
    printf("  （BFS 这个「按层输出」的性质，后面求最短路径会用到）\n");

//@s 正常结束
    return 0;
}
//%end
