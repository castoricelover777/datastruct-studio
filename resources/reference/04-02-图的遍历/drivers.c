/*
 * ============================================================================
 *  04 图 / 04-02 图的遍历 —— 练习模式的测试驱动
 * ============================================================================
 *  图一：0-1，1-2，2-3，3-0（一个环）
 *  图二：0-1 和 2-3（两块，不连通）
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与建图（只用类型和本模块的函数） */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    MGraph G;
    int visited[MAXV];
    int i, j;

    CreateGraph(&G, 4, edges, 4);

    printf("顶点数 %d，边数 %d\n\n", G.nv, G.ne);

    for (i = 0; i < 4; i++)
    {
        printf("  ");
        for (j = 0; j < 4; j++) printf("%d ", G.g[i][j]);
        printf("\n");
    }

    printf("\n矩阵里数出来的边数 = %d（应该等于 4）\n", CountEdgesInMatrix(&G));

    ClearVisited(visited, 4);
    printf("visited 清零后: ");
    for (i = 0; i < 4; i++) printf("%d ", visited[i]);
    printf("\n（全 0 表示「都没去过」—— 遍历开始前必须清空）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 DFS：一路钻到底 */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    MGraph G;
    int visited[MAXV];

    CreateGraph(&G, 4, edges, 4);

    ClearVisited(visited, 4);
    printf("从 0 出发 DFS: ");
    DFS(&G, 0, visited);
    printf("\n（应该是 0 1 2 3 —— 一条路走到底）\n");

    ClearVisited(visited, 4);
    printf("\n从 2 出发 DFS: ");
    DFS(&G, 2, visited);
    printf("\n（换个起点，序列跟着变）\n");

    printf("\nvisited 数组最终状态: ");
    for (int i = 0; i < 4; i++) printf("%d ", visited[i]);
    printf("\n（全是 1 —— 都访问到了）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 DFSIter：和递归版结果一致 */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    MGraph G;
    int visited[MAXV];

    CreateGraph(&G, 4, edges, 4);

    ClearVisited(visited, 4);
    printf("递归版 DFS: ");
    DFS(&G, 0, visited);
    printf("\n");

    ClearVisited(visited, 4);
    printf("栈版  DFS: ");
    DFSIter(&G, 0, visited);
    printf("\n（两种写法结果一致）\n");

    printf("\n为什么栈版要逆序压栈？因为栈是后进先出 ——\n");
    printf("从大到小压进去，弹出来才是从小到大。\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 BFS：一层一层扩散 */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 0, 2 }, { 1, 3 }, { 1, 4 }, { 2, 5 }, { 2, 6 } };
    MGraph G;
    int visited[MAXV];

    CreateGraph(&G, 7, edges, 6);

    ClearVisited(visited, 7);
    printf("BFS 从 0 出发: ");
    BFS(&G, 0, visited);
    printf("\n");

    ClearVisited(visited, 7);
    printf("DFS 从 0 出发: ");
    DFS(&G, 0, visited);
    printf("\n");

    printf("\n（BFS 是 0 → 1 2 → 3 4 5 6，按层来的）\n");
    printf("（DFS 是一条路走到黑）\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 TraverseAll：非连通图要遍历多次 */
int main(void)
{
    /* 两块不连通 */
    static const int two[][2] = { { 0, 1 }, { 2, 3 } };
    /* 完全连通 */
    static const int one[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    MGraph G;
    int visited[MAXV];
    int comp;

    CreateGraph(&G, 4, two, 2);
    printf("图：0-1 和 2-3（两块）\n");
    ClearVisited(visited, 4);
    printf("  只从 0 出发 DFS: ");
    DFS(&G, 0, visited);
    printf(" ← 只碰到 0 和 1\n");

    comp = TraverseAll(&G, visited, 1);
    printf("  TraverseAll 之后: ");
    for (int i = 0; i < 4; i++) printf("%d ", visited[i]);
    printf("\n  连通分量个数 = %d\n\n", comp);

    CreateGraph(&G, 4, one, 4);
    printf("图：0-1，1-2，2-3，3-0（一个环，全连通）\n");
    comp = TraverseAll(&G, visited, 1);
    printf("  连通分量个数 = %d\n", comp);
    printf("\n（外层循环转几次，图就有几个连通分量）\n");

    return 0;
}
//%driver-end
