/*
 * ============================================================================
 *  03 树 / 03-06 并查集 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与初始化（只用类型和 InitSet，不碰其他模块） */
int main(void)
{
    DisjSet *S = InitSet(6);
    int i;

    printf("sizeof(DisjSet) = %d 字节（一个指针 + 一个 int）\n", (int)sizeof(DisjSet));
    printf("元素个数 n = %d\n\n", S->n);

    printf("初始 parent 数组: ");
    for (i = 0; i < 6; i++)
    {
        printf("%d ", S->parent[i]);
    }
    printf("\n（全是 -1：每个元素都是根，各自成一个大小为 1 的集合）\n\n");

    printf("下标:             ");
    for (i = 0; i < 6; i++)
    {
        printf("%d ", i);
    }
    printf("\n\n");

    printf("含义：parent[i] >= 0 是父亲下标；< 0 表示它是根，绝对值是集合大小\n");
    printf("（用一个字段表达两层含义 —— 省内存，也让「是不是根」一眼可判）\n");

    free(S->parent);
    free(S);
    return 0;
}
//%driver-end


//%driver | 02
/* 验证 Find：找到根；路径压缩把沿途结点直接挂到根上 */
int main(void)
{
    DisjSet *S = InitSet(5);

    /* 手工搭一条链：4 -> 3 -> 2 -> 1 -> 0，0 是根 */
    S->parent[0] = -5;
    S->parent[1] = 0;
    S->parent[2] = 1;
    S->parent[3] = 2;
    S->parent[4] = 3;

    printf("手工搭的链（4→3→2→1→0）：\n  ");
    for (int i = 0; i < 5; i++) printf("%d ", S->parent[i]);
    printf("\n");

    printf("\n查 4 的根 = %d\n", Find(S, 4));
    printf("压缩后 parent 数组: ");
    for (int i = 0; i < 5; i++) printf("%d ", S->parent[i]);
    printf("\n（沿途的 4 3 2 1 现在都直接指向根 0 了）\n");

    printf("\n再查一次 4 的根 = %d（这次一步到位）\n", Find(S, 4));

    FreeSet(S);
    return 0;
}
//%driver-end

//%driver | 03
/* 验证 Union：按大小合并，小树挂到大树下面 */
int main(void)
{
    DisjSet *S = InitSet(6);

    Union(S, Find(S, 0), Find(S, 1));
    printf("合并 0 1 之后: ");
    for (int i = 0; i < 6; i++) printf("%d ", S->parent[i]);
    printf("\n");

    Union(S, Find(S, 2), Find(S, 3));
    Union(S, Find(S, 4), Find(S, 5));
    printf("再合并 2-3 和 4-5: ");
    for (int i = 0; i < 6; i++) printf("%d ", S->parent[i]);
    printf("\n");

    Union(S, Find(S, 1), Find(S, 4));
    printf("把两个大小为 2 的集合合并: ");
    for (int i = 0; i < 6; i++) printf("%d ", S->parent[i]);
    printf("\n（负数绝对值最大的那个是根，它记录了整个集合的大小）\n");

    printf("\n集合个数 = %d\n", CountSets(S));

    FreeSet(S);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 IsConnected：比较的是根，不是父亲 */
int main(void)
{
    DisjSet *S = InitSet(5);

    Union(S, Find(S, 0), Find(S, 1));
    Union(S, Find(S, 1), Find(S, 2));

    printf("parent 数组: ");
    for (int i = 0; i < 5; i++) printf("%d ", S->parent[i]);
    printf("\n");

    printf("\n0 和 2 同组吗？%s\n", IsConnected(S, 0, 2) ? "是" : "不是");
    printf("0 和 3 同组吗？%s\n", IsConnected(S, 0, 3) ? "是" : "不是");
    printf("（0 和 2 的父亲不同，但根相同 —— 所以要比较根，不能比较父亲）\n");

    FreeSet(S);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 CountSets：每合并一次就少一个集合 */
int main(void)
{
    DisjSet *S = InitSet(8);
    int i;

    printf("初始集合个数 = %d\n", CountSets(S));

    for (i = 1; i < 8; i++)
    {
        Union(S, Find(S, 0), Find(S, i));
        printf("把 %d 并进 0 那一组之后，集合个数 = %d\n", i, CountSets(S));
    }

    printf("\n（每成功合并一次，集合数就减一 —— 这就是数连通分量的原理）\n");

    FreeSet(S);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 CheckCycle：两端已连通就说明有环 */
int main(void)
{
    /* 有环的图：三角形 */
    static const int cycle[][2] = { { 0, 1 }, { 1, 2 }, { 2, 0 } };
    /* 没有环的图：一条链 */
    static const int tree[][2] = { { 0, 1 }, { 1, 2 } };
    /* 有环的图：正方形带一条对角线 */
    static const int square[][2] = { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 0 } };

    DisjSet *A = InitSet(3);
    DisjSet *B = InitSet(3);
    DisjSet *C = InitSet(4);

    printf("三角形 0-1 1-2 2-0  : %s\n", CheckCycle(A, cycle, 3) ? "有环" : "没有环");
    printf("链     0-1 1-2      : %s\n", CheckCycle(B, tree, 2) ? "有环" : "没有环");
    printf("正方形 0-1 1-2 2-3 3-0: %s\n", CheckCycle(C, square, 4) ? "有环" : "没有环");

    printf("\n（逐条加边，只要遇到「两端已经连通」，这条边就绕成了环）\n");

    FreeSet(A);
    FreeSet(B);
    FreeSet(C);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证 FreeSet */
int main(void)
{
    DisjSet *S = InitSet(4);

    Union(S, Find(S, 0), Find(S, 1));

    printf("释放前集合个数 = %d\n", CountSets(S));
    FreeSet(S);
    printf("已释放（先 free 数组，再 free 结构体）\n");
    printf("（顺序反了就拿不到数组指针了）\n");

    return 0;
}
//%driver-end
