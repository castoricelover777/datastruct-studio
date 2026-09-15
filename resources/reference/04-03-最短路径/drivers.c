/*
 * ============================================================================
 *  04 图 / 04-03 最短路径 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用这张带权图：
 *          0 ──2── 1
 *          │       │
 *          5       1
 *          │       │
 *          3 ──1── 2
 *  从 0 出发的答案：到 1 是 2，到 2 是 3，到 3 是 4
 *  （注意到 3 直连是 5，绕一圈反而更近）
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与建图（只用本模块的函数） */
int main(void)
{
    static const int edges[][3] = { { 0, 1, 2 }, { 0, 3, 5 }, { 1, 2, 1 }, { 2, 3, 1 } };
    MGraph G;
    int dist[MAXV];
    int path[MAXV];
    int i, j;

    CreateWeightedGraph(&G, 4, edges, 4);

    printf("顶点数 %d，边数 %d\n\n", G.nv, G.ne);

    for (i = 0; i < 4; i++)
    {
        printf("  ");
        for (j = 0; j < 4; j++)
        {
            if (G.g[i][j] >= INF) printf("%6s", "INF");
            else printf("%6d", G.g[i][j]);
        }
        printf("\n");
    }

    printf("\n对角线全是 0: %s\n", G.g[0][0] == 0 && G.g[3][3] == 0 ? "是" : "不是");
    printf("没有边的地方是 INF = %d\n", INF);
    printf("（为什么不用 0 表示无边？因为权值本身可能就是 0，会分不清）\n");


    printf("\n初始化 dist/path：\n");
    InitDistPath(&G, 0, dist, path);
    printf("  dist: ");
    for (i = 0; i < 4; i++)
    {
        if (dist[i] >= INF) printf("INF ");
        else printf("%d ", dist[i]);
    }
    printf("\n  path: ");
    for (i = 0; i < 4; i++) printf("%d ", path[i]);
    printf("\n（dist 一开始只知道源点直连的那些边，path 记下是从谁来的）\n");

    return 0;
}
//%driver-end


//%driver | 02
/* 验证 FindMinDist：挑出未收录中 dist 最小的 */
int main(void)
{
    static const int edges[][3] = { { 0, 1, 2 }, { 0, 3, 5 }, { 1, 2, 1 }, { 2, 3, 1 } };
    MGraph G;
    int dist[MAXV];
    int path[MAXV];
    int collected[MAXV];
    int i;
    int v;

    CreateWeightedGraph(&G, 4, edges, 4);
    InitDistPath(&G, 0, dist, path);

    printf("初始 dist: ");
    for (i = 0; i < 4; i++)
    {
        if (dist[i] >= INF) printf("INF ");
        else printf("%d ", dist[i]);
    }
    printf("\n（0 是源点自己，2 是到 1，INF 表示不直连）\n\n");

    for (i = 0; i < 4; i++) collected[i] = 0;
    collected[0] = 1;

    printf("顺带数一下边数 = %d\n\n", CountWeightedEdges(&G));

    v = FindMinDist(&G, dist, collected);
    printf("未收录里 dist 最小的顶点 = %d（dist = %d）\n", v, dist[v]);

    collected[v] = 1;
    v = FindMinDist(&G, dist, collected);
    printf("再挑一次 = %d\n", v);
    printf("（已经收录的不再参与 —— 它的答案已经定了）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 Dijkstra：距离和路径都要对 */
int main(void)
{
    static const int edges[][3] = { { 0, 1, 2 }, { 0, 3, 5 }, { 1, 2, 1 }, { 2, 3, 1 } };
    MGraph G;
    int dist[MAXV];
    int path[MAXV];

    CreateWeightedGraph(&G, 4, edges, 4);
    Dijkstra(&G, 0, dist, path);

    printf("从 0 出发的最短距离：\n");
    printf("  到 1 = %d（0→1，直接走）\n", dist[1]);
    printf("  到 2 = %d（0→1→2，绕一下比直连快）\n", dist[2]);
    printf("  到 3 = %d ← 重点！直连是 5，绕 0→1→2→3 只要 4\n", dist[3]);

    printf("\npath 数组: ");
    for (int i = 0; i < 4; i++) printf("%d ", path[i]);
    printf("\n（path[i] 表示 i 是从谁那儿过来的，-1 表示没有前驱）\n");

    printf("\n如果 3 的答案是 5 而不是 4，说明松弛那步写错了：\n");
    printf("  常见错误：漏了 dist[v] + g[v][w] < dist[w] 的判断\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 PrintPath：还原成完整路径 */
int main(void)
{
    static const int edges[][3] = { { 0, 1, 2 }, { 0, 3, 5 }, { 1, 2, 1 }, { 2, 3, 1 } };
    MGraph G;
    int dist[MAXV];
    int path[MAXV];

    CreateWeightedGraph(&G, 4, edges, 4);
    Dijkstra(&G, 0, dist, path);

    printf("到 1 的路径: "); PrintPath(path, 1); printf("\n");
    printf("到 2 的路径: "); PrintPath(path, 2); printf("\n");
    printf("到 3 的路径: "); PrintPath(path, 3); printf("\n");
    printf("\n（PrintPath 用递归把顺序翻正：先打印前面一段，再打印自己）\n");
    printf("（和二叉树后序遍历是同一个套路）\n");

    printf("\n全部结果：\n");
    PrintAll(&G, 0, dist, path);

    return 0;
}
//%driver-end
