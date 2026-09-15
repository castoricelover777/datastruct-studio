/*
 * ============================================================================
 *  04 图 / 04-04 最小生成树 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用这张带权图（6 个顶点、9 条边）：
 *     0-1(6) 0-2(1) 0-3(5) 1-3(5) 1-4(3) 2-3(2) 3-4(6) 3-5(4) 4-5(6)
 *  最小生成树的总权值应该是 15。
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与建图、抽边表（只用本模块的函数） */
int main(void)
{
    static const int edges[][3] = {
        { 0, 1, 6 }, { 0, 2, 1 }, { 0, 3, 5 },
        { 1, 3, 5 }, { 1, 4, 3 },
        { 2, 3, 2 },
        { 3, 4, 6 }, { 3, 5, 4 },
        { 4, 5, 6 }
    };
    MGraph G;
    Edge edgeList[MAXE];
    int n;
    int i, j;

    CreateGraph(&G, 6, edges, 9);

    printf("顶点数 %d，边数 %d\n\n", G.nv, G.ne);

    for (i = 0; i < 6; i++)
    {
        printf("  ");
        for (j = 0; j < 6; j++)
        {
            if (G.g[i][j] >= INF) printf("%5s", "INF");
            else printf("%5d", G.g[i][j]);
        }
        printf("\n");
    }

    n = BuildEdgeList(&G, edgeList);
    printf("\n抽出来的边表（%d 条，应该等于 9）：\n", n);
    for (i = 0; i < n; i++)
    {
        printf("  ");
        PrintEdge(edgeList[i]);
        printf("\n");
    }
    printf("（只收 u<v 的，避免同一条边收两次）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 Prim：生成树的边和总权值 */
int main(void)
{
    static const int edges[][3] = {
        { 0, 1, 6 }, { 0, 2, 1 }, { 0, 3, 5 },
        { 1, 3, 5 }, { 1, 4, 3 },
        { 2, 3, 2 },
        { 3, 4, 6 }, { 3, 5, 4 },
        { 4, 5, 6 }
    };
    MGraph G;
    int parent[MAXV];
    int total;

    CreateGraph(&G, 6, edges, 9);
    total = Prim(&G, 0, parent);

    printf("从 0 出发的 Prim：\n");
    printf("  选出的边：\n");
    PrintTreeEdges(parent, 6);
    printf("  总权值 = %d\n", total);
    printf("  （6 个顶点应该正好选出 5 条边）\n");

    printf("\nPrim 和 Dijkstra 只差一行：\n");
    printf("  Dijkstra: dist[w] = dist[v] + G->g[v][w];\n");
    printf("  Prim    : dist[w] = G->g[v][w];\n");
    printf("（生成树只看「每条边多长」，不像最短路那样要累计路程）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证并查集：FindRoot / UnionSets / InitSets */
int main(void)
{
    int parent[MAXV];
    int i;

    InitSets(parent, 6);
    printf("初始化后: ");
    for (i = 0; i < 6; i++) printf("%d ", parent[i]);
    printf("\n（全是 -1，每个元素各自成组）\n\n");

    printf("0 和 4 的根分别是 %d、%d\n", FindRoot(parent, 0), FindRoot(parent, 4));
    printf("（不同 → 不连通）\n\n");

    UnionSets(parent, FindRoot(parent, 0), FindRoot(parent, 1));
    printf("合并 0 和 1 之后: ");
    for (i = 0; i < 6; i++) printf("%d ", parent[i]);
    printf("\n");

    UnionSets(parent, FindRoot(parent, 0), FindRoot(parent, 4));
    printf("再把 0 和 4 并起来: ");
    for (i = 0; i < 6; i++) printf("%d ", parent[i]);
    printf("\n");

    printf("\n现在 1 和 4 的根: %d、%d → %s\n",
           FindRoot(parent, 1), FindRoot(parent, 4),
           FindRoot(parent, 1) == FindRoot(parent, 4) ? "同组" : "不同组");
    printf("（Kruskal 就是靠这个判断「加这条边会不会成环」）\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 SortEdges：边按权值从小到大 */
int main(void)
{
    static const int edges[][3] = {
        { 0, 1, 6 }, { 0, 2, 1 }, { 0, 3, 5 },
        { 1, 3, 5 }, { 1, 4, 3 },
        { 2, 3, 2 },
        { 3, 4, 6 }, { 3, 5, 4 },
        { 4, 5, 6 }
    };
    MGraph G;
    Edge edgeList[MAXE];
    int n;
    int i;

    CreateGraph(&G, 6, edges, 9);
    n = BuildEdgeList(&G, edgeList);

    printf("排序前：\n");
    PrintEdges(edgeList, n);

    SortEdges(edgeList, n);

    printf("\n排序后（应该按权值递增）：\n");
    PrintEdges(edgeList, n);

    printf("\n（Kruskal 的第一步就是把边排好 —— 排序算法用什么都行，\n");
    printf("  这里用冒泡只是为了代码短）\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 Kruskal：和 Prim 的总权值必须一致 */
int main(void)
{
    static const int edges[][3] = {
        { 0, 1, 6 }, { 0, 2, 1 }, { 0, 3, 5 },
        { 1, 3, 5 }, { 1, 4, 3 },
        { 2, 3, 2 },
        { 3, 4, 6 }, { 3, 5, 4 },
        { 4, 5, 6 }
    };
    /* 一个不连通的图：0-1 和 2-3 两块 */
    static const int bad[][3] = { { 0, 1, 1 }, { 2, 3, 1 } };

    MGraph G;
    MGraph G2;
    Edge edgeList[MAXE];
    int n;
    int total;

    CreateGraph(&G, 6, edges, 9);
    n = BuildEdgeList(&G, edgeList);
    total = Kruskal(&G, edgeList, n);

    printf("Kruskal 总权值 = %d\n", total);
    printf("（应该和 Prim 一样是 15）\n\n");

    printf("Kruskal 的三步：\n");
    printf("  ① 边排序  ② 依次试：两端不连通就加，连通就跳过  ③ 加够 n-1 条停\n");
    printf("（判断「会不会成环」用的就是并查集）\n\n");

    /* 不连通的图 */
    CreateGraph(&G2, 4, bad, 2);
    n = BuildEdgeList(&G2, edgeList);
    total = Kruskal(&G2, edgeList, n);
    printf("不连通的图：Kruskal 返回 %d（-1 表示没有生成树）\n", total);
    printf("（4 个顶点只能加出 1 条边，凑不够 n-1=3 条）\n");

    return 0;
}
//%driver-end
