/*
 * ============================================================================
 *  04 图 / 04-05 拓扑排序 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用这张 AOV 网：
 *      0 ──→ 2 ──→ 4
 *      ↓           ↑
 *      1 ──→ 3 ────┘
 *  边：(0,2) (0,1) (1,3) (2,4) (3,4)
 *  一个合法的拓扑序：0 2 1 3 4
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义、建图、入度出度（只用本模块的函数） */
int main(void)
{
    static const int edges[][2] = { { 0, 2 }, { 0, 1 }, { 1, 3 }, { 2, 4 }, { 3, 4 } };
    DGraph G;
    int indegree[MAXV];
    int i, j;

    CreateDGraph(&G, 5, edges, 5);

    printf("顶点数 %d，边数 %d\n\n", G.nv, G.ne);

    for (i = 0; i < 5; i++)
    {
        printf("  ");
        for (j = 0; j < 5; j++) printf("%3d", G.g[i][j]);
        printf("\n");
    }

    printf("\n矩阵是否对称: %s\n", G.g[0][1] == G.g[1][0] ? "是" : "不是");
    printf("（有向图只填一个格子，所以矩阵不对称）\n\n");

    CalcIndegree(&G, indegree);
    printf("入度 / 出度：\n");
    for (i = 0; i < 5; i++)
    {
        printf("  顶点 %d：入度 = %d，出度 = %d\n", i, indegree[i], OutDegree(&G, i));
    }
    printf("（入度 = 0 的顶点没有前置任务，可以先做）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 TopSort：拓扑序合法，且能检测环 */
int main(void)
{
    static const int edges[][2] = { { 0, 2 }, { 0, 1 }, { 1, 3 }, { 2, 4 }, { 3, 4 } };
    static const int cyc[][2] = { { 0, 1 }, { 1, 2 }, { 2, 0 } };
    DGraph G;
    DGraph C;
    int order[MAXV];
    int n;
    int i;

    CreateDGraph(&G, 5, edges, 5);
    n = TopSort(&G, order);

    printf("拓扑序: ");
    for (i = 0; i < n; i++) printf("%d ", order[i]);
    printf("\n排出了 %d / 5 个顶点\n", n);
    printf("有环: %s\n\n", HasCycle(&G) ? "是" : "不是");

    printf("验证：每条边都应该从前往后\n");
    for (i = 0; i < 5; i++) ;
    printf("  边 0→2、0→1、1→3、2→4、3→4，对照上面的序列检查\n\n");

    CreateDGraph(&C, 3, cyc, 3);
    n = TopSort(&C, order);
    printf("有环的图 0→1→2→0：排出了 %d / 3 个顶点\n", n);
    printf("有环: %s\n", HasCycle(&C) ? "是" : "不是");
    printf("（环上每点入度都是 1，谁也降不到 0，一个都进不了队）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 DFSVisit：后序位置是从后往前填的 */
int main(void)
{
    static const int edges[][2] = { { 0, 2 }, { 0, 1 }, { 1, 3 }, { 2, 4 }, { 3, 4 } };
    DGraph G;
    int visited[MAXV];
    int order[MAXV];
    int pos;
    int i;

    CreateDGraph(&G, 5, edges, 5);

    for (i = 0; i < 5; i++) visited[i] = 0;
    for (i = 0; i < 5; i++) order[i] = -1;

    pos = 4;
    DFSVisit(&G, 0, visited, order, &pos);

    printf("从 0 出发做一次 DFS，order 数组变成：\n  ");
    for (i = 0; i < 5; i++)
    {
        if (order[i] < 0) printf(" _ ");
        else printf("%d ", order[i]);
    }
    printf("\n");

    printf("pos 最后停在 %d（从 0 开始说明填满了 5 个）\n", pos);
    printf("（注意 0 被填在了最后 —— 因为它是最后才回溯完的）\n");
    printf("（这个「从后往前填」就是逆后序，下个模块靠它得到拓扑序）\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 TopSortDFS：也是合法的拓扑序 */
int main(void)
{
    static const int edges[][2] = { { 0, 2 }, { 0, 1 }, { 1, 3 }, { 2, 4 }, { 3, 4 } };
    DGraph G;
    int order1[MAXV];
    int order2[MAXV];
    int n1, n2;
    int i;

    CreateDGraph(&G, 5, edges, 5);

    n1 = TopSort(&G, order1);
    PrintOrder("Kahn 算法  : ", order1, n1);

    n2 = TopSortDFS(&G, order2);
    PrintOrder("DFS 逆后序 : ", order2, n2);

    printf("\n两个序列不一样，但都合法 —— 拓扑排序不唯一\n");
    printf("（只要每条边都从前往后就行）\n");

    printf("\nDFS 逆后序为什么对？\n");
    printf("  有边 A→B 时，DFS 会先递归到 B，B 先拿到后序位置\n");
    printf("  所以 B 的后序位置更靠前、A 更靠后\n");
    printf("  把位置反过来用，A 就排在 B 前面了\n");

    (void)i;
    return 0;
}
//%driver-end
