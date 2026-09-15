/*
 * ============================================================================
 *  数据结构研习社 —— 04 图 / 04-04 最小生成树
 * ============================================================================
 *
 *  问题：给一张**带权连通图**，选出若干条边把所有顶点连起来，
 *        要求边的总权值最小。选出来的这些边一定构成一棵树（叫生成树）。
 *
 *  为什么一定是树？因为：
 *
 *      · 要连通 → 边数至少 n-1
 *      · 成环就说明有冗余边 → 去掉它会更小
 *
 *  所以最优解一定是"n 个点、n-1 条边、没有环"，也就是一棵树。
 *
 *  两种经典算法，都是贪心，但贪的东西不一样：
 *
 *      **Prim   加点法**：从任意一点出发，每次把"离当前树最近的顶点"加进来
 *      **Kruskal 加边法**：把所有边从小到大排序，每次加"不成环的最短边"
 *
 *  有意思的是 Prim 和上一节的 Dijkstra 长得几乎一模一样 ——
 *  只差一行。这一节会把那一行标出来。
 *
 *  用这张图当例子（6 个顶点）：
 *
 *          0 ──6── 1
 *          │ ╲     │ ╲
 *          1   5   5   3
 *          │     ╲ │     ╲
 *          2 ──2── 3 ──6── 4
 *                └──4── 5
 *
 *  标记约定同前（本文件本身可编译）。
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>

//%module | 01 | typedef | 头文件与 typedef | 2 |
//%summary | 图还是邻接矩阵，另外准备一个边表给 Kruskal 用。
//@d ============ 为什么要两种表示都留着 ============
//@d
//@d   Prim 要频繁地问"哪个顶点离树最近" —— 用**邻接矩阵**方便。
//@d   Kruskal 要把边排序、还要判环     —— 用**边表**方便。
//@d
//@d 所以这一节两种都定义。这不是凑数，而是算法本身决定的数据结构选择：
//@d **先想清楚算法要反复做什么，再决定用什么存。**
//@d
//@d ============ 边表长什么样 ============
//@d
//@d   每条边存三个整数：起点、终点、权值。
//@d
//@d     边表:  (0,1,6) (0,2,1) (0,3,5) (1,3,5) ...
//@d
//@d 从邻接矩阵到边表的转换要注意：**无向图每条边会被数两次**，
//@d 所以只收 u < v 的那些，避免重复。

//@s 最多顶点数
#define MAXV 100

//@s 最多边数
#define MAXE 1000

//@s 没有边
#define INF 65535

//@s 带权图（邻接矩阵）
typedef struct
{
//@s 顶点数
    int nv;
//@s 边数
    int ne;
//@s g[i][j] 是权值，INF 表示无边
    int g[MAXV][MAXV];
} MGraph;

//@s 一条边
typedef struct
{
//@s 起点
    int u;
//@s 终点
    int v;
//@s 权值
    int w;
} Edge;

//@s 用带权边表建图
void CreateGraph(MGraph *G, int nv, const int edges[][3], int edgeCount)
{
//@s 循环用
    int i, j;

//@s 记规模
    G->nv = nv;
    G->ne = edgeCount;

//@s 初始化矩阵
    for (i = 0; i < nv; i++)
    {
        for (j = 0; j < nv; j++)
        {
            G->g[i][j] = (i == j) ? 0 : INF;
        }
    }

//@s 填边
    for (i = 0; i < edgeCount; i++)
    {
        G->g[edges[i][0]][edges[i][1]] = edges[i][2];
        G->g[edges[i][1]][edges[i][0]] = edges[i][2];
    }
}

//@s 从邻接矩阵抽出边表（供 Kruskal 用）
//@d 只收 u < v 的，避免同一条边收两次。
int BuildEdgeList(MGraph *G, Edge edges[])
{
//@s 循环用
    int i, j;
//@s 计数
    int count = 0;

    for (i = 0; i < G->nv; i++)
    {
        for (j = i + 1; j < G->nv; j++)
        {
//@s 有边就收进来
            if (G->g[i][j] < INF)
            {
                edges[count].u = i;
                edges[count].v = j;
                edges[count].w = G->g[i][j];
                count++;
            }
        }
    }

//@s 返回边数
    return count;
}

//@s 把一条边打印成 "u-v(w)" 的形式
void PrintEdge(Edge e)
{
    printf("%d-%d(%d)", e.u, e.v, e.w);
}
//%end

//%module | 02 | Prim | Prim —— 加点法 | 3 | 01 |
//%summary | 从一点出发，每次把「离树最近」的顶点加进来。
//@d ============ Prim 和 Dijkstra 长得几乎一样 ============
//@d
//@d 把两个算法的更新那一行摆在一起看：
//@d
//@d   Dijkstra:  dist[w] = dist[v] + G->g[v][w];   ← 加上"从源点过来的距离"
//@d   Prim    :  dist[w] = G->g[v][w];            ← 只看"到树的一条边"
//@d
//@d 差别就在这：Dijkstra 关心的是**从源点出发的总路程**，
//@d Prim 关心的是**这条边本身有多长**。
//@d
//@d 原因也很清楚：
//@d
//@d   · 最短路要"累计" —— 走的路越长，到终点就越远
//@d   · 生成树只看"每条边多长" —— 树的总权值是所有边相加，
//@d     所以只关心"新加进来的这条边"，不需要把前面的距离带上
//@d
//@d ============ dist 在这里是什么意思 ============
//@d
//@d Dijkstra 里 dist[w] = 源点到 w 的距离。
//@d Prim 里 dist[w] = **w 到"当前的树"最近的一条边的权值**。
//@d
//@d 所以一开始，只有起点自己和它的直连邻居有值，其余都是 INF。
//@d 每加进来一个顶点 v，就用 v 的边去更新其他还没入树的顶点。
//@d
//@d ============ 走一遍 ============
//@d
//@d 从 0 出发，dist 初值 = [0, 6, 1, 5, INF, INF]
//@d
//@d   第 1 轮：挑 dist 最小的未入树顶点 → 2（dist=1），加进来，总权值 +1
//@d            用 2 更新：2-3 权 2 < 5 → dist[3] = 2
//@d
//@d   第 2 轮：挑 → 3（dist=2），加进来，总权值 +2 = 3
//@d            用 3 更新：3-4 权 6 → dist[4]=6；3-5 权 4 → dist[5]=4
//@d
//@d   第 3 轮：挑 → 5（dist=4），总权值 3+4 = 7
//@d
//@d   第 4 轮：挑 → 1（dist=5），总权值 12
//@d
//@d   第 5 轮：挑 → 4（dist=3），总权值 15
//@d
//@d 一共加了 5 个顶点（n-1 条边），总权值 15。

//@s 从顶点 s 出发做 Prim，返回最小生成树的总权值；不连通返回 -1
int Prim(MGraph *G, int s, int parent[])
{
//@s dist[w]：w 到当前生成树最近的一条边的权值
    int dist[MAXV];
//@s visited[w]：w 是否已经入树
    int visited[MAXV];
//@s 总权值
    int total = 0;
//@s 循环用
    int i, v, w;
//@s 当前最小的 dist
    int minDist;

//@s 初始化
    for (i = 0; i < G->nv; i++)
    {
//@s 一开始"树"里只有 s，所以 dist 就是 s 到各点的直连边
        dist[i] = G->g[s][i];
//@s 记下每个点是从树里哪个点连过来的
        parent[i] = s;
//@s 都还没入树
        visited[i] = 0;
    }

//@s 起点入树
    dist[s] = 0;
    visited[s] = 1;
    parent[s] = -1;

//@s 还要加 n-1 个顶点
    for (i = 1; i < G->nv; i++)
    {
//@s ① 在没入树的顶点里找 dist 最小的
        v = -1;
        minDist = INF;

        for (w = 0; w < G->nv; w++)
        {
            if (visited[w] == 0 && dist[w] < minDist)
            {
                minDist = dist[w];
                v = w;
            }
        }

//@s 找不到说明图不连通，没有生成树
        if (v < 0)
        {
            return -1;
        }

//@s ② 把它加进树
        visited[v] = 1;
//@s 这条边的权值计入总权值
        total += dist[v];

//@s ③ 用 v 去更新其他顶点到树的距离
        for (w = 0; w < G->nv; w++)
        {
//@s 没入树、且有边、且这条边比原来更短
//@d 注意这里直接就是 G->g[v][w]，不加上 dist[v] —— 这就是和 Dijkstra 的差别。
            if (visited[w] == 0 && G->g[v][w] < dist[w])
            {
                dist[w] = G->g[v][w];
                parent[w] = v;
            }
        }
    }

//@s 返回总权值
    return total;
}

//@s 打印生成树的每条边（根据 parent 数组）
void PrintTreeEdges(int parent[], int n)
{
//@s 循环用
    int i;

    for (i = 0; i < n; i++)
    {
//@s 起点没有父亲
        if (parent[i] < 0)
        {
            continue;
        }
//@s 打印一条边
        printf("  (%d, %d)\n", parent[i], i);
    }
}
//%end

//%module | 03 | FindRoot | FindRoot —— 并查集：找根 | 3 | 01 |
//%summary | Kruskal 判断"加这条边会不会成环"就靠它。
//@d ============ Kruskal 为什么需要并查集 ============
//@d
//@d Kruskal 的做法是"从小到大试每条边，能加就加"。
//@d 问题是怎么判断"这条边能不能加" —— 也就是**加了会不会成环**。
//@d
//@d 一条边 (u, v) 会成环，等价于：**u 和 v 已经连通了**。
//@d 而"判断两点是否连通"正是并查集的看家本领（见 03-06）。
//@d
//@d 所以 Kruskal = 边排序 + 并查集，两个老朋友拼在一起。
//@d
//@d ============ 这里用最简版的并查集 ============
//@d
//@d 03-06 讲的是完整的并查集（负数存大小、按大小合并、路径压缩）。
//@d 这里为了不把篇幅拉太长，用简化版：
//@d
//@d     parent[i] = -1  表示 i 是根
//@d     parent[i] >= 0 表示 i 的父亲
//@d
//@d 只保留路径压缩（贡献最大的那个优化），不做按大小合并。
//@d 对 Kruskal 来说够用了 —— 因为边的数量通常不会太大。

//@s 找 x 所在集合的根（带路径压缩）
//@d parent[i] < 0 表示 i 是根
int FindRoot(int parent[], int x)
{
//@s 自己是根
    if (parent[x] < 0)
    {
        return x;
    }
//@s 否则递归往上找，并把结果写回去（路径压缩）
    return parent[x] = FindRoot(parent, parent[x]);
}

//@s 把两个集合合并
//@d 参数必须是根的下标
void UnionSets(int parent[], int r1, int r2)
{
//@s 随便挂：让 r2 认 r1 当父亲
//@d 简化版不做按大小合并，够用。
    parent[r2] = r1;
}

//@s 初始化并查集
void InitSets(int parent[], int n)
{
//@s 循环用
    int i;

//@s 每个元素各自成组
    for (i = 0; i < n; i++)
    {
        parent[i] = -1;
    }
}
//%end

//%module | 04 | SortEdges | SortEdges —— 把边按权值排序 | 2 | 01 |
//%summary | Kruskal 的第一步：所有边从小到大排好。
//@d ============ 为什么用冒泡 ============
//@d
//@d Kruskal 的正确性不依赖排序算法好不好，随便什么排序都行。
//@d 这里用冒泡是为了**代码短、好读**，把注意力留给算法本身。
//@d
//@d 真做工程的话边数可能上万，那就该换成快排（下一章会讲）。
//@d
//@d 复杂度上，冒泡是 O(e²)，快排是 O(e log e)。e 大的时候差很多。
//@d 但 Kruskal 本身的瓶颈通常也不在这儿。

//@s 把边表按权值从小到大排序（冒泡）
void SortEdges(Edge edges[], int n)
{
//@s 循环用
    int i, j;
//@s 交换用
    Edge tmp;

    for (i = 0; i < n - 1; i++)
    {
        for (j = 0; j < n - 1 - i; j++)
        {
//@s 前面的比后面大就交换
            if (edges[j].w > edges[j + 1].w)
            {
                tmp = edges[j];
                edges[j] = edges[j + 1];
                edges[j + 1] = tmp;
            }
        }
    }
}

//@s 打印边表
void PrintEdges(Edge edges[], int n)
{
//@s 循环用
    int i;

    for (i = 0; i < n; i++)
    {
        printf("  ");
        PrintEdge(edges[i]);
        printf("\n");
    }
}
//%end

//%module | 05 | Kruskal | Kruskal —— 加边法 | 3 | 01,03,04 |
//%summary | 边从小到大试，不成环就加 —— 用并查集判环。
//@d ============ Kruskal 的三步 ============
//@d
//@d   ① 把所有边按权值从小到大排序
//@d   ② 依次看每条边：两端的顶点还不连通 → 加进来；已经连通 → 跳过（会成环）
//@d   ③ 加够 n-1 条就停
//@d
//@d 为什么加够 n-1 条就能停？因为 n 个顶点的树正好有 n-1 条边。
//@d 如果所有边试完还没到 n-1 条，说明图不连通。
//@d
//@d ============ 为什么先试短的边一定对 ============
//@d
//@d 这是贪心。直觉上：既然要"总权值最小"，那能用短边就用短边。
//@d
//@d 严格证明要用"割"的概念，但有个很实用的理解方式：
//@d
//@d   把边按从小到大排好之后，"最短的那条边"一定可以入选 ——
//@d   因为它不成环（图里只有它一条边时不可能成环），
//@d   而任何生成树都必须跨过它连接的那两个连通块，早晚要用一条边，
//@d   用最短的那条不会更差。
//@d
//@d 这就是 Kruskal 的核心：**每一步都在当前能选的里面挑最短的。**
//@d
//@d ============ Prim 和 Kruskal 的关系 ============
//@d
//@d 两者都是贪心，结果的总权值**一定相同**（虽然可能选出不同的边）。
//@d
//@d   看"点"贪心 → Prim，适合稠密图（O(n²)，不依赖边数）
//@d   看"边"贪心 → Kruskal，适合稀疏图（O(e log e)，只和边数有关）
//@d
//@d 所以稠密图用 Prim、稀疏图用 Kruskal —— 和邻接矩阵/邻接表的选择是一个道理。

//@s Kruskal：返回最小生成树总权值；不连通返回 -1
int Kruskal(MGraph *G, Edge edges[], int edgeCount)
{
//@s 并查集
    int parent[MAXV];
//@s 总权值
    int total = 0;
//@s 已经加了几条边
    int count = 0;
//@s 循环用
    int i;
//@s 边两端的根
    int ru, rv;

//@s 初始化并查集：每个顶点各自一组
    InitSets(parent, G->nv);

//@s ① 边按权值排序
    SortEdges(edges, edgeCount);

//@s ② 依次看每条边
//@d 循环条件里带 `count < G->nv - 1`，是为了"加够了就提前收工"。
    for (i = 0; i < edgeCount && count < G->nv - 1; i++)
    {
//@s 找两端的根
        ru = FindRoot(parent, edges[i].u);
        rv = FindRoot(parent, edges[i].v);

//@s 根相同 → 已经连通 → 这条边会成环，跳过
        if (ru == rv)
        {
            continue;
        }

//@s ③ 不成环 → 加进来
        UnionSets(parent, ru, rv);
        total += edges[i].w;
        count++;
    }

//@s 边数和 n-1 对不上说明图不连通
    if (count != G->nv - 1)
    {
        return -1;
    }

//@s 返回总权值
    return total;
}
//%end

//%module | 06 | main | main —— 两种算法对着跑 | 3 | 01,02,03,04,05 |
//%summary | 同一张图，Prim 和 Kruskal 应该给出同一个总权值。
//@d ============ 为什么要两个都算一遍 ============
//@d
//@d 因为它们是两种完全不同的思路，**结果必须一样**。
//@d
//@d 如果总权值不同，那至少有一个是错的 —— 这种"两条路互相验证"
//@d 比只看一个结果可靠得多，前面最大子列和那节也用过这一招。

//@s 主函数
int main(void)
{
//@s 带权边表：{ 起点, 终点, 权值 }
//@d 6 个顶点的一张带权图。
    static const int edges[][3] = {
        { 0, 1, 6 }, { 0, 2, 1 }, { 0, 3, 5 },
        { 1, 3, 5 }, { 1, 4, 3 },
        { 2, 3, 2 },
        { 3, 4, 6 }, { 3, 5, 4 },
        { 4, 5, 6 }
    };
//@s 边数
    int edgeCount = 9;
//@s 图
    MGraph G;
//@s 生成树里每个点的父亲
    int parent[MAXV];
//@s 边表
    Edge edgeList[MAXE];
//@s 两个算法的结果
    int primTotal, kruskalTotal;
//@s 实际抽出的边数
    int n;
//@s 循环用
    int i;

//@s 建图
    CreateGraph(&G, 6, edges, edgeCount);

//@s 打印邻接矩阵
    printf("带权图的邻接矩阵（INF = 无边）：\n");
    printf("      ");
    for (i = 0; i < G.nv; i++)
    {
        printf("%5d", i);
    }
    printf("\n");

    for (i = 0; i < G.nv; i++)
    {
        printf("  %2d [", i);
        for (int j = 0; j < G.nv; j++)
        {
            if (G.g[i][j] >= INF)
            {
                printf("%5s", "INF");
            }
            else
            {
                printf("%5d", G.g[i][j]);
            }
        }
        printf(" ]\n");
    }
    printf("\n");

//@s 抽边表
    n = BuildEdgeList(&G, edgeList);
    printf("按邻接矩阵抽出来的边表（%d 条，只收 u<v 的避免重复）：\n", n);
    PrintEdges(edgeList, n);

//@s ==== Prim ====
    printf("\n=== Prim（加点法）===\n");
    primTotal = Prim(&G, 0, parent);

    if (primTotal < 0)
    {
        printf("  图不连通，没有生成树\n");
    }
    else
    {
        printf("  选出的边：\n");
        PrintTreeEdges(parent, G.nv);
        printf("  总权值 = %d\n", primTotal);
    }

//@s 重新抽一次边表（上一个算法的排序会打乱它，为了对比干净）
    n = BuildEdgeList(&G, edgeList);

//@s ==== Kruskal ====
    printf("\n=== Kruskal（加边法）===\n");
    kruskalTotal = Kruskal(&G, edgeList, n);

    if (kruskalTotal < 0)
    {
        printf("  图不连通，没有生成树\n");
    }
    else
    {
        printf("  总权值 = %d\n", kruskalTotal);
    }

//@s 两个结果必须一致
    printf("\n两种算法结果对比：\n");
    printf("  Prim    = %d\n", primTotal);
    printf("  Kruskal = %d\n", kruskalTotal);

    if (primTotal == kruskalTotal)
    {
        printf("  一致 —— 两种完全不同的思路给出同一个总权值，说明都对\n");
    }
    else
    {
        printf("  不一致！至少有一个写错了\n");
    }

    printf("\n（Prim 和 Dijkstra 只差一行：\n");
    printf("  Dijkstra 是 dist[v] + g[v][w]，Prim 是 g[v][w]）\n");

//@s 正常结束
    return 0;
}
//%end
