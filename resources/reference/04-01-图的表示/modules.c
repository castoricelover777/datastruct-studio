/*
 * ============================================================================
 *  数据结构研习社 —— 04 图 / 04-01 图的表示
 * ============================================================================
 *
 *  图和树的区别只有一句话：**树是"一对多"，图是"多对多"**。
 *
 *  树里每个结点只有一个父亲，所以不会绕圈；图里谁都可以连谁，
 *  于是出现了两个新问题：
 *
 *      ① 怎么存？（树用指针就够了，图不行）
 *      ② 怎么防止绕圈走不出去？（遍历时要记录"访问过没有"）
 *
 *  这一节解决第 ① 个问题。两种存法各有各的用处：
 *
 *      **邻接矩阵**：一个二维数组，G[i][j] 表示 i 到 j 有没有边
 *      **邻接表**  ：每个顶点挂一条链表，串着它的所有邻居
 *
 *  下面这张无向图，两种存法都拿它当例子：
 *
 *          0 ── 1
 *          │    │
 *          3 ── 2
 *
 *  标记约定同前（本文件本身可编译）。
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>

//%module | 01 | typedef | 头文件与 typedef | 2 |
//%summary | 邻接矩阵用二维数组，邻接表用"数组 + 链表"。
//@d ============ 邻接矩阵长什么样 ============
//@d
//@d 一个二维数组 G[nv][nv]，G[i][j] 表示从 i 到 j 有没有边：
//@d
//@d             0  1  2  3
//@d        0 [  0  1  0  1 ]
//@d        1 [  1  0  1  0 ]
//@d        2 [  0  1  0  1 ]
//@d        3 [  1  0  1  0 ]
//@d
//@d 特点：
//@d
//@d   · 判断"i 和 j 之间有没有边"只要**一次数组访问**，O(1) —— 这是它最大的优点
//@d   · 无向图的矩阵是**对称**的（G[i][j] == G[j][i]），所以有一半空间是浪费的
//@d   · 不管图里实际有多少条边，都要占 n² 个格子
//@d
//@d 所以邻接矩阵适合**稠密图**（边数接近 n²）：反正都要占这么多空间，
//@d 换个 O(1) 的判断速度很划算。
//@d
//@d ============ 邻接表长什么样 ============
//@d
//@d 每个顶点挂一条链表，串着和它相邻的所有顶点：
//@d
//@d        0 → [1] → [3]
//@d        1 → [0] → [2]
//@d        2 → [1] → [3]
//@d        3 → [0] → [2]
//@d
//@d 特点：
//@d
//@d   · 空间是 O(n + e)：**有多少边就占多少空间**，稀疏图下省得多
//@d   · 判断"i 和 j 有没有边"要顺着 i 的链表找，最坏 O(n)
//@d   · 想列举"i 的所有邻居"很自然 —— 遍历链表就行
//@d
//@d 所以邻接表适合**稀疏图**（实际中的图绝大多数都是稀疏的）。
//@d
//@d ============ 怎么选 ============
//@d
//@d   稠密图、经常要判断两点是否相邻  →  邻接矩阵
//@d   稀疏图、经常要遍历某个点的邻居  →  邻接表
//@d
//@d 后面的 DFS、BFS、Dijkstra 用两种都能写。本课程统一用矩阵，
//@d 因为它写起来短、看起来直观；但要知道**工程里邻接表更常用**。

//@s 最多多少个顶点
#define MAXV 100

//@s 表示"没有边"的特殊值
//@d 用一个大数而不是 0，是为了把"没有边"和"权值为 0 的边"区分开。
//@d 如果图不带权，只是 0/1，那用 0 表示无边也没问题。
#define INF 65535

//@s 邻接矩阵存图
typedef struct
{
//@s 顶点数
    int nv;
//@s 边数
    int ne;
//@s 矩阵：g[i][j] 为 0 表示无边，非 0 表示有边（或权值）
    int g[MAXV][MAXV];
} MGraph;

//@s 邻接表的边结点
typedef struct AdjNode
{
//@s 这个邻居的顶点编号
    int adjv;
//@s 边的权值（无权图可以忽略）
    int weight;
//@s 下一个邻居
    struct AdjNode *next;
} AdjNode, *AdjList;

//@s 邻接表存图
typedef struct
{
//@s 每个顶点一条链表，head[i] 是顶点 i 的邻居链表头
    AdjList head[MAXV];
//@s 顶点数
    int nv;
//@s 边数
    int ne;
} LGraph;

//@s 状态码
#define OK 1
#define ERROR 0
typedef int Status;
//%end

//%module | 02 | CreateMatrix | CreateMatrix —— 用邻接矩阵建图 | 2 | 01 |
//%summary | 先清空矩阵，再逐条边填两个格子。
//@d ============ 建图的步骤 ============
//@d
//@d   ① 把整个矩阵清零（表示"什么边都没有"）
//@d   ② 读入每一条边 (u, v)，把 g[u][v] 和 g[v][u] 都置 1
//@d
//@d 第 ② 步的两个格子都要填 —— 因为是无向图。
//@d
//@d **只填一半是最常见的错误**：图看起来能跑，但只能"从 u 走到 v"，
//@d 不能反过来走。遍历的时候会得到莫名其妙的结果。
//@d
//@d 有向图就只填 g[u][v] 一个格子，这正是有向和无向在存储上的唯一区别。
//@d
//@d ============ 顶点编号 ============
//@d
//@d 图里的顶点通常编号 0..n-1（或者 1..n）。这里统一用 0 起始，
//@d 这样可以直接当数组下标用，不用到处做 +1/-1 的转换。

//@s 用边表建一个邻接矩阵存的无向图
//@d edges 每条边两个端点，edgeCount 是边数
void CreateMatrix(MGraph *G, int nv, const int edges[][2], int edgeCount)
{
//@s 循环用
    int i, j;

//@s 记下顶点数
    G->nv = nv;
//@s 记下边数
    G->ne = edgeCount;

//@s ① 矩阵清零
    for (i = 0; i < nv; i++)
    {
        for (j = 0; j < nv; j++)
        {
            G->g[i][j] = 0;
        }
    }

//@s ② 逐条边填格子
    for (i = 0; i < edgeCount; i++)
    {
//@s 取出两个端点
        int u = edges[i][0];
        int v = edges[i][1];

//@s 无向图：两个方向都要填
//@d 有向图这里只写 G->g[u][v] = 1 就够了。
        G->g[u][v] = 1;
        G->g[v][u] = 1;
    }
}

//@s 判断 i 和 j 之间有没有边
//@d 邻接矩阵最大的优势就是这一句 —— O(1)。
int HasEdge(MGraph *G, int i, int j)
{
//@s 直接查表
    return G->g[i][j] != 0;
}
//%end

//%module | 03 | CreateList | CreateList —— 用邻接表建图 | 3 | 01 |
//%summary | 每个顶点一条链表，插边就是往两条链表里各插一个结点。
//@d ============ 建邻接表 ============
//@d
//@d   ① 把所有链表头置空
//@d   ② 读入边 (u, v)：在 u 的链表里插一个"v 号邻居"，在 v 的链表里插一个"u 号邻居"
//@d
//@d 又是"两个方向都要插" —— 和邻接矩阵一样。
//@d
//@d ============ 头插法 ============
//@d
//@d 插件点用**头插**（插在链表最前面），因为：
//@d
//@d   · 不用找尾，O(1) 就完成
//@d   · 链表里的顺序本来就不重要（邻居之间无先后）
//@d
//@d 代价是链表里的顺序和插边顺序**相反**。如果做题时要求输出"按编号从小到大"，
//@d 就得先收集再排序，或者改用尾插。
//@d
//@d ============ 空间对比 ============
//@d
//@d 还是 4 个顶点 4 条边的那个图：
//@d
//@d   邻接矩阵：4×4 = 16 个 int
//@d   邻接表：  4 个链表头 + 4×2 = 8 个边结点
//@d
//@d 顶点一多差距就惊人了。1000 个顶点、2000 条边：
//@d
//@d   邻接矩阵：1000×1000 = 100 万个格子
//@d   邻接表：  1000 + 4000 = 5000 个结点
//@d
//@d 差 200 倍。这就是稀疏图必须用邻接表的原因。

//@s 在顶点 u 的链表头部插一个邻居 v
//@d 单独抽出来是因为要调用两次（u 那边一次、v 那边一次）。
void AddEdgeNode(LGraph *G, int u, int v, int w)
{
//@s 造一个边结点
    AdjNode *node = (AdjNode *)malloc(sizeof(AdjNode));
//@s 分配失败要挡住
    if (node == NULL)
    {
        printf("内存分配失败\n");
        exit(1);
    }

//@s 填内容
    node->adjv = v;
    node->weight = w;

//@s 头插：新结点指向原来的第一个
    node->next = G->head[u];

//@s 链表头改成新结点
    G->head[u] = node;
}

//@s 用边表建一个邻接表存的无向图
void CreateList(LGraph *G, int nv, const int edges[][2], int edgeCount)
{
//@s 循环用
    int i;

//@s 记下规模
    G->nv = nv;
    G->ne = edgeCount;

//@s ① 所有链表头置空
    for (i = 0; i < nv; i++)
    {
        G->head[i] = NULL;
    }

//@s ② 逐条边插两个结点
    for (i = 0; i < edgeCount; i++)
    {
        int u = edges[i][0];
        int v = edges[i][1];

//@s u 的邻居里加上 v
        AddEdgeNode(G, u, v, 1);
//@s v 的邻居里加上 u —— 别漏
        AddEdgeNode(G, v, u, 1);
    }
}

//@s 判断 i 和 j 之间有没有边
//@d 邻接表在这里比矩阵慢：要顺着链表找，最坏 O(n)。
int HasEdgeList(LGraph *G, int i, int j)
{
//@s 顺着 i 的链表找
    AdjNode *p = G->head[i];

    while (p != NULL)
    {
//@s 找到了
        if (p->adjv == j)
        {
            return 1;
        }
//@s 下一个
        p = p->next;
    }

//@s 找完了也没有
    return 0;
}

//@s 数一数顶点 i 有几个邻居（也就是它的度）
int DegreeOf(LGraph *G, int i)
{
//@s 遍历计数
    AdjNode *p = G->head[i];
    int count = 0;

    while (p != NULL)
    {
        count++;
        p = p->next;
    }

    return count;
}
//%end

//%module | 04 | PrintMatrix | PrintMatrix —— 打印邻接矩阵 | 1 | 01 |
//%summary | 按行列打印矩阵，顺便检查对称性。
//@d 打印出来看一眼，比在脑子里想有用得多。
//@d 尤其要检查两件事：**矩阵是不是对称的**、**对角线是不是 0**。
void PrintMatrix(MGraph *G)
{
//@s 循环用
    int i, j;
//@s 对称性检查
    int symmetric = 1;

//@s 打印列号
    printf("     ");
    for (j = 0; j < G->nv; j++)
    {
        printf("%3d", j);
    }
    printf("\n");

//@s 逐行打印
    for (i = 0; i < G->nv; i++)
    {
        printf("%3d [", i);

        for (j = 0; j < G->nv; j++)
        {
            printf("%3d", G->g[i][j]);

//@s 顺便检查对称
            if (G->g[i][j] != G->g[j][i])
            {
                symmetric = 0;
            }
        }
        printf(" ]\n");
    }

//@s 报告对称性
    printf("\n无向图的邻接矩阵一定对称: %s\n", symmetric ? "是（检查通过）" : "不是（有问题）");
}
//%end

//%module | 05 | PrintList | PrintList —— 打印邻接表 | 1 | 01 |
//%summary | 每个顶点一行，列出它的所有邻居。
//@d 邻接表的打印顺序取决于插边顺序（因为是头插，顺序是反的）。
//@d 要按编号从小到大输出，就得先收集到一个数组里再排序。

//@s 打印邻接表
void PrintList(LGraph *G)
{
//@s 循环用
    int i;
//@s 遍历指针
    AdjNode *p;

    for (i = 0; i < G->nv; i++)
    {
        printf("%2d → ", i);
        p = G->head[i];

        while (p != NULL)
        {
            printf("[%d] ", p->adjv);
            p = p->next;
        }
        printf("(度 = %d)\n", DegreeOf(G, i));
    }
}
//%end

//%module | 06 | FreeList | FreeList —— 释放邻接表 | 1 | 01 |
//%summary | 逐条链表释放所有边结点。
//@d 每个边结点都是单独 malloc 的，要一个个放。
//@d 注意**先记住 next 再 free 当前结点** —— 顺序反了就取不到下一个了。
void FreeList(LGraph *G)
{
//@s 循环用
    int i;
//@s 当前结点和下一个
    AdjNode *p, *q;

    for (i = 0; i < G->nv; i++)
    {
        p = G->head[i];

        while (p != NULL)
        {
//@s 先记住下一个
            q = p->next;
//@s 再释放当前
            free(p);
//@s 往后走
            p = q;
        }

//@s 链表头置空，防止变成野指针
        G->head[i] = NULL;
    }
}
//%end

//%module | 07 | main | main —— 两种存法摆在一起 | 2 | 01,02,03,04,05,06 |
//%summary | 同一张图，用两种方式建、两种方式打印，对比优劣。
//@d ============ 一个必须注意的细节 ============
//@d
//@d 邻接表里有 malloc，所以用完必须 FreeList。
//@d 而邻接矩阵是结构体里的一个固定数组，不用释放。
//@d
//@d 这个差别本身就说明了两种存法的性格：
//@d **矩阵是"开好一大块地，用多少算多少"；邻接表是"用多少开多少，用完要还"**。

//@s 主函数
int main(void)
{
//@s 图：0-1，1-2，2-3，3-0（一个正方形）
//@d 四条边、四个顶点，刚好是个环。
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
//@s 顶点数
    int nv = 4;
//@s 边数
    int ne = 4;
//@s 邻接矩阵
    MGraph G;
//@s 邻接表
    LGraph L;
//@s 循环用
    int i;

//@s 打印图的样子
    printf("图：0-1，1-2，2-3，3-0\n");
    printf("        0 ── 1\n");
    printf("        │    │\n");
    printf("        3 ── 2\n\n");

//@s 建矩阵存法
    CreateMatrix(&G, nv, edges, ne);
    printf("=== 邻接矩阵 ===\n");
    PrintMatrix(&G);

//@s 建表存法
    CreateList(&L, nv, edges, ne);
    printf("\n=== 邻接表 ===\n");
    PrintList(&L);

//@s 对比两种查边的速度
    printf("\n=== 查边对比 ===\n");
    printf("查 0 和 2 有没有边：\n");
    printf("  邻接矩阵 %s（一次数组访问）\n", HasEdge(&G, 0, 2) ? "有" : "无");
    printf("  邻接表   %s（要顺着 0 的链表找）\n", HasEdgeList(&L, 0, 2) ? "有" : "无");
    printf("查 0 和 1 有没有边：\n");
    printf("  邻接矩阵 %s\n", HasEdge(&G, 0, 1) ? "有" : "无");
    printf("  邻接表   %s\n", HasEdgeList(&L, 0, 1) ? "有" : "无");

//@s 数度数
    printf("\n=== 每个顶点的度 ===\n");
    for (i = 0; i < nv; i++)
    {
        printf("  顶点 %d 的度 = %d\n", i, DegreeOf(&L, i));
    }
    printf("（无向图里每个点的度就是它邻居的个数，也就是它在链表里的结点数）\n");

//@s 空间对比
    printf("\n=== 空间对比 ===\n");
    printf("  邻接矩阵：%d × %d = %d 个 int\n", nv, nv, nv * nv);
    printf("  邻接表  ：%d 个链表头 + %d 个边结点\n", nv, 2 * ne);
    printf("（顶点多了差距会非常明显：1000 个点时是 100 万 对 5000）\n");

//@s 释放邻接表
//@d 矩阵不用释放（它是结构体里的固定数组），表必须释放。
    FreeList(&L);
    printf("\n邻接表已释放（矩阵不用释放，它是固定数组）\n");

//@s 正常结束
    return 0;
}
//%end
