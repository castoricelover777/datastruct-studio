/*
 * ============================================================================
 *  05 排序 / 05-02 堆排序、归并排序 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用 { 5, 1, 4, 2, 8, 3 }（6 个元素，方便手算核对）
 * ============================================================================
 */

//%driver | 01
/* 验证公共定义（只用本模块的函数） */
int main(void)
{
    ElementType a[4];
    ElementType x = 3;
    ElementType y = 7;

    a[0] = 5; a[1] = 1; a[2] = 4; a[3] = 2;

    printf("sizeof(ElementType) = %d 字节\n\n", (int)sizeof(ElementType));

    printf("交换前: x = %d, y = %d\n", x, y);
    Swap(&x, &y);
    printf("交换后: x = %d, y = %d\n", x, y);

    printf("\n下标公式（注意这里是 0 起始，和 03-04 的 1 起始不同）：\n");
    printf("  结点 i 的左孩子 = 2i+1，右孩子 = 2i+2，父亲 = (i-1)/2\n");
    printf("  最后一个非叶结点 = N/2 - 1\n");
    printf("  N=6 时最后一个非叶结点是下标 %d\n", 6 / 2 - 1);
    printf("（03-04 用的是 1 起始，所以那边是 N/2 —— 两个基准别搞混）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 PercDown：最大堆的下沉 */
int main(void)
{
    /* 手工摆一个"根不合规矩"的数组：根是 1，其余是合法的最大堆 */
    ElementType a[] = { 1, 8, 4, 5, 3, 2 };
    int n = 6;
    int i;

    printf("下沉前: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");
    printf("（根是 1，比它的孩子 8 和 4 都小，不合规矩）\n\n");

    PercDown(a, 0, n);

    printf("下沉后: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");
    printf("（1 一路沉到没有孩子为止）\n\n");

    printf("检查堆序（每个结点都不小于它的孩子）：\n");
    for (i = 0; i * 2 + 1 < n; i++)
    {
        int ok = 1;
        if (a[i] < a[i * 2 + 1]) ok = 0;
        if (i * 2 + 2 < n && a[i] < a[i * 2 + 2]) ok = 0;
        printf("  结点 %d (%d)：%s\n", i, a[i], ok ? "合法" : "不合法");
    }

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 HeapSort：先建堆，再反复取堆顶 */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8, 3 };
    ElementType c[] = { 5, 1, 4, 2, 8, 3 };
    int n = 6;
    int i;

    /* 先看建堆的效果 */
    for (i = n / 2 - 1; i >= 0; i--)
    {
        PercDown(c, i, n);
    }
    printf("建堆之后: [");
    for (i = 0; i < n; i++) printf("%d%s", c[i], i < n - 1 ? ", " : "");
    printf("]\n");
    printf("（最大值 8 到了 A[0] —— 这是最大堆的核心性质）\n\n");

    /* 再完整排一遍 */
    printf("原始:     [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");

    HeapSort(a, n);

    printf("堆排序后: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");
    printf("有序: %s\n", IsSorted(a, n) ? "是" : "不是");

    printf("\n（阶段二每轮把堆顶换到末尾，末尾那个位置就退出堆 ——\n");
    printf("  所以 PercDown 的第三个参数是「当前堆的大小」，不是数组长度）\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 Merge：两个有序段合成一个 */
int main(void)
{
    /* 左段 [0,2] = 1 5 8，右段 [3,5] = 2 4 9 */
    ElementType a[] = { 1, 5, 8, 2, 4, 9 };
    ElementType tmp[6];
    int i;

    printf("合并前: [");
    for (i = 0; i < 6; i++) printf("%d%s", a[i], i < 5 ? ", " : "");
    printf("]\n");
    printf("        左段 [0..2] = 1 5 8    右段 [3..5] = 2 4 9\n\n");

    Merge(a, tmp, 0, 3, 5);

    printf("合并后: [");
    for (i = 0; i < 6; i++) printf("%d%s", a[i], i < 5 ? ", " : "");
    printf("]\n");
    printf("（两边各自从头比，谁小先放谁）\n\n");

    printf("稳定性：比较时写的是 A[L] <= A[R]，相等时优先取左边\n");
    printf("（左边元素在原数组里本来就更靠前，这样相对顺序不会变）\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 MSort：递归分治 */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8, 3 };
    ElementType tmp[6];
    int i;

    printf("原始:     [");
    for (i = 0; i < 6; i++) printf("%d%s", a[i], i < 5 ? ", " : "");
    printf("]\n\n");

    printf("分治过程：\n");
    printf("  [5 1 4 2 8 3]\n");
    printf("    劈成 [5 1 4] 和 [2 8 3]\n");
    printf("      [5 1 4] 劈成 [5 1] 和 [4]\n");
    printf("        [5 1] 劈成 [5]、[1] → 合并 → [1 5]\n");
    printf("        [1 5] 和 [4] → 合并 → [1 4 5]\n");
    printf("      [2 8 3] 劈成 [2 8] 和 [3] → [2 8] → 合并得 [2 3 8]\n");
    printf("    最后 [1 4 5] 和 [2 3 8] → 合并 → [1 2 3 4 5 8]\n\n");

    MSort(a, tmp, 0, 5);

    printf("MSort 结果: [");
    for (i = 0; i < 6; i++) printf("%d%s", a[i], i < 5 ? ", " : "");
    printf("]\n");
    printf("有序: %s\n", IsSorted(a, 6) ? "是" : "不是");

    return 0;
}
//%driver-end

//%driver | 06
/* 验证 MergeSort：外面这层负责分配临时空间 */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8, 3, 9, 0, 7, 6 };
    int n = 10;
    int i;

    printf("原始:     [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");

    MergeSort(a, n);

    printf("归并之后: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");
    printf("有序: %s\n", IsSorted(a, n) ? "是" : "不是");

    printf("\n为什么临时数组只在最外层分配一次？\n");
    printf("  如果在 Merge 里 malloc，就要 malloc n 次，开销巨大\n");
    printf("  所以把 TmpA 当参数一路传下去\n");
    printf("\n代价就是 O(n) 的额外空间 —— 这是归并排序唯一的缺点\n");

    return 0;
}
//%driver-end

//%driver | 07
/* 验证 PrintArray 与 IsSorted */
int main(void)
{
    ElementType a[] = { 1, 2, 3, 4, 5 };
    ElementType b[] = { 5, 4, 3, 2, 1 };
    ElementType c[] = { 1, 3, 2, 4, 5 };
    ElementType d2[] = { 7 };

    printf("a = "); PrintArray(a, 5);
    printf("  有序: %s\n", IsSorted(a, 5) ? "是" : "不是");

    printf("b = "); PrintArray(b, 5);
    printf("  有序: %s\n", IsSorted(b, 5) ? "是" : "不是");

    printf("c = "); PrintArray(c, 5);
    printf("  有序: %s（3 和 2 颠倒了）\n", IsSorted(c, 5) ? "是" : "不是");

    printf("d = "); PrintArray(d2, 1);
    printf("  有序: %s（只有一个元素，天然有序）\n", IsSorted(d2, 1) ? "是" : "不是");

    printf("\n（排完序一定要跑一遍 IsSorted —— 排序算法的 bug 往往很隐蔽，\n");
    printf("  大部分数据都对，只在某个特定排列下出错）\n");

    return 0;
}
//%driver-end
