/*
 * ============================================================================
 *  04 图 / 04-01 图的表示 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用这张图：0-1，1-2，2-3，3-0（四个顶点四条边的一个正方形）
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义（只用类型，不调用其他模块） */
int main(void)
{
    MGraph G;
    LGraph L;

    G.nv = 4;
    G.ne = 4;
    G.g[0][1] = 1;

    L.nv = 4;
    L.ne = 4;
    L.head[0] = NULL;

    printf("sizeof(MGraph) = %d 字节\n", (int)sizeof(MGraph));
    printf("  → 主要是那个 %dx%d 的 int 矩阵，共 %d 个格子\n", MAXV, MAXV, MAXV * MAXV);
    printf("sizeof(LGraph) = %d 字节\n", (int)sizeof(LGraph));
    printf("  → %d 个链表头（指针），边结点用多少开多少\n\n", MAXV);

    printf("关键区别：\n");
    printf("  矩阵：空间 O(n^2)，判断两点是否相邻 O(1)\n");
    printf("  邻接表：空间 O(n+e)，判断相邻要顺着链表找 O(n)\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 CreateMatrix：对称、对角线为 0、每条边两个格子 */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    MGraph G;
    int i, j;

    CreateMatrix(&G, 4, edges, 4);

    printf("顶点数 %d，边数 %d\n\n", G.nv, G.ne);

    for (i = 0; i < 4; i++)
    {
        printf("  ");
        for (j = 0; j < 4; j++)
        {
            printf("%d ", G.g[i][j]);
        }
        printf("\n");
    }

    printf("\n对角线全是 0: %s\n", G.g[0][0] == 0 && G.g[1][1] == 0 ? "是" : "不是");
    printf("矩阵是否对称: %s\n", G.g[0][1] == G.g[1][0] && G.g[2][3] == G.g[3][2] ? "是" : "不是");
    printf("（无向图必须对称 —— 只填一半是最常见的错误）\n");

    printf("\n查边：\n");
    printf("  0 和 1：%s\n", HasEdge(&G, 0, 1) ? "有边" : "无边");
    printf("  0 和 2：%s\n", HasEdge(&G, 0, 2) ? "有边" : "无边");
    printf("（矩阵查边是一次数组访问，O(1)）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 CreateList：每个顶点的邻居链表 */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    LGraph L;
    int i;
    AdjNode *p;

    CreateList(&L, 4, edges, 4);

    printf("顶点数 %d，边数 %d\n\n", L.nv, L.ne);

    for (i = 0; i < 4; i++)
    {
        printf("  %d 的邻居: ", i);
        p = L.head[i];
        while (p != NULL)
        {
            printf("%d ", p->adjv);
            p = p->next;
        }
        printf("\n");
    }

    printf("\n（顺序和插边顺序相反 —— 因为用的是头插）\n");

    printf("\n查边：\n");
    printf("  0 和 1：%s\n", HasEdgeList(&L, 0, 1) ? "有边" : "无边");
    printf("  0 和 2：%s\n", HasEdgeList(&L, 0, 2) ? "有边" : "无边");
    printf("（邻接表查边要顺着链表找，最坏 O(n)）\n");

    FreeList(&L);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 PrintMatrix */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    MGraph G;

    CreateMatrix(&G, 4, edges, 4);
    PrintMatrix(&G);
    printf("\n（对角线是 0，矩阵对称，每行 1 的个数就是该顶点的度）\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 PrintList */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    LGraph L;

    CreateList(&L, 4, edges, 4);
    PrintList(&L);
    printf("\n（每个顶点的度就是它链表里的结点数）\n");

    FreeList(&L);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 FreeList */
int main(void)
{
    static const int edges[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };
    LGraph L;
    int i;
    int count = 0;
    AdjNode *p;

    CreateList(&L, 4, edges, 4);

    for (i = 0; i < 4; i++)
    {
        for (p = L.head[i]; p != NULL; p = p->next) count++;
    }
    printf("释放前共有 %d 个边结点（4 条边 × 2 = 8）\n", count);

    FreeList(&L);

    /* 释放后再数一遍，应该都是 0 */
    count = 0;
    for (i = 0; i < 4; i++)
    {
        for (p = L.head[i]; p != NULL; p = p->next) count++;
    }
    printf("释放后有 %d 个（链表头都置空了）\n", count);
    printf("（必须先把 next 存下来再 free 当前结点，顺序反了就取不到下一个）\n");

    return 0;
}
//%driver-end
