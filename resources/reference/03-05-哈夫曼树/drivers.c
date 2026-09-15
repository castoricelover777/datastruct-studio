/*
 * ============================================================================
 *  03 树 / 03-05 哈夫曼树 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用权值 {5, 2, 7, 1, 4}，也就是 5 个叶子。
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义：数组存树，2n-1 个结点 */
int main(void)
{
    HTNode n;

    n.weight = 7;
    n.parent = 0;
    n.left = 0;
    n.right = 0;

    printf("sizeof(HTNode) = %d 字节（四个 int）\n", (int)sizeof(HTNode));
    printf("parent / left / right 存的都是数组下标，0 表示「没有」\n");
    printf("所以下标要从 1 开始用，0 号位置空着当空指针\n\n");
    printf("n 个叶子 → 内部结点 n-1 个 → 总共 %s\n", "2n-1 个");
    printf("数组开 2n+1 格（下标 1..2n-1）就够\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 SelectTwoMin：挑出两个最小且没有父亲的结点 */
int main(void)
{
    HuffmanTree HT = (HuffmanTree)malloc(11 * sizeof(HTNode));
    int s1, s2;
    int i;

    /* 手工摆五个叶子：权值 5 2 7 1 4 */
    for (i = 1; i <= 5; i++)
    {
        HT[i].weight = 0;
        HT[i].parent = 0;
        HT[i].left = 0;
        HT[i].right = 0;
    }
    HT[1].weight = 5;
    HT[2].weight = 2;
    HT[3].weight = 7;
    HT[4].weight = 1;
    HT[5].weight = 4;

    SelectTwoMin(HT, 5, &s1, &s2);
    printf("全部参与挑选 → 最小是下标 %d（权值 %d），次小是下标 %d（权值 %d）\n",
           s1, HT[s1].weight, s2, HT[s2].weight);
    printf("（应该是 4 号权值 1、2 号权值 2）\n\n");

    /* 给 4 号安个父亲，它就不该再被挑中 */
    HT[4].parent = 6;
    SelectTwoMin(HT, 5, &s1, &s2);
    printf("给 4 号安上父亲后再挑 → 最小 %d（权值 %d），次小 %d（权值 %d）\n",
           s1, HT[s1].weight, s2, HT[s2].weight);
    printf("（有父亲的不能参与，所以现在是 2 和 5）\n");

    free(HT);
    return 0;
}
//%driver-end

//%driver | 03
/* 验证 HuffmanCreate：结点总数、根、权的和 */
int main(void)
{
    static const int w[] = { 5, 2, 7, 1, 4 };
    HuffmanTree HT = NULL;
    int n = 5;
    int sum = 0;
    int i;

    HuffmanCreate(&HT, w, n);

    printf("叶子 %d 个，结点总数应该是 2n-1 = %d\n", n, 2 * n - 1);
    printf("根是下标 %d，权值 %d\n", 2 * n - 1, HT[2 * n - 1].weight);

    for (i = 1; i <= n; i++) sum += w[i - 1];
    printf("所有叶子权值之和 = %d（根的权值应该正好等于它）\n\n", sum);

    printf("合并过程：\n");
    for (i = n + 1; i <= 2 * n - 1; i++)
    {
        printf("  %d = %d + %d，权值 %d\n", i, HT[i].left, HT[i].right, HT[i].weight);
        printf("     （%d 和 %d 的 parent 都是 %d）\n", HT[i].left, HT[i].right, i);
    }

    free(HT);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 HuffmanCodes：权值大的编码短，且没有前缀关系 */
int main(void)
{
    static const int w[] = { 5, 2, 7, 1, 4 };
    HuffmanTree HT = NULL;
    HuffmanCode HC = NULL;
    int n = 5;
    int i;

    HuffmanCreate(&HT, w, n);
    HuffmanCodes(HT, n, &HC);

    printf("权值   编码\n");
    for (i = 1; i <= n; i++)
    {
        printf("%4d   %s\n", HT[i].weight, HC[i]);
    }
    printf("\n（权值大的编码短 —— 这正是压缩的原理）\n");
    printf("前缀码检查: %s\n", CheckPrefixFree(HC, n) ? "通过" : "失败");

    FreeAll(HT, HC, n);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 GetWPL：手算对账 */
int main(void)
{
    static const int w[] = { 5, 2, 7, 1, 4 };
    HuffmanTree HT = NULL;
    HuffmanCode HC = NULL;
    int n = 5;
    int wpl;
    int byCode = 0;
    int i;

    HuffmanCreate(&HT, w, n);
    HuffmanCodes(HT, n, &HC);

    /* 用 GetWPL 算 */
    wpl = GetWPL(HT, n);

    /* 再用「权值 × 编码长度」算一遍对账 */
    for (i = 1; i <= n; i++)
    {
        byCode += HT[i].weight * (int)strlen(HC[i]);
    }

    printf("GetWPL 算出来 = %d\n", wpl);
    printf("用「权值 × 编码长度」累加 = %d\n", byCode);
    printf("（两者必须相等 —— 因为 WPL 就是所有叶子编码的加权总长度）\n");

    FreeAll(HT, HC, n);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 PrintCoding 与 CheckPrefixFree */
int main(void)
{
    static const int w[] = { 5, 2, 7, 1, 4 };
    HuffmanTree HT = NULL;
    HuffmanCode HC = NULL;
    int n = 5;

    HuffmanCreate(&HT, w, n);
    HuffmanCodes(HT, n, &HC);

    PrintCoding(HT, HC, n);

    printf("\n前缀码检查: %s\n", CheckPrefixFree(HC, n) ? "通过（没有任何编码是别人的前缀）" : "失败");

    FreeAll(HT, HC, n);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证 FreeAll：先里后外释放 */
int main(void)
{
    static const int w[] = { 5, 2, 7, 1, 4 };
    HuffmanTree HT = NULL;
    HuffmanCode HC = NULL;
    int n = 5;

    HuffmanCreate(&HT, w, n);
    HuffmanCodes(HT, n, &HC);

    printf("释放前：树的结点数 = %d，编码表有 %d 条\n", 2 * n - 1, n);
    printf("  叶子 1 的编码 = %s\n", HC[1]);

    FreeAll(HT, HC, n);
    printf("释放完成\n");
    printf("（顺序：先 free 每个编码字符串，再 free 编码表，最后 free 结点数组）\n");

    return 0;
}
//%driver-end
