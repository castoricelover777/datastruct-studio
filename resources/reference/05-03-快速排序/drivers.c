/*
 * ============================================================================
 *  05 排序 / 05-03 快速排序 —— 练习模式的测试驱动
 * ============================================================================
 *  多用几组数据：随机、已有序、大量重复 —— 快排的坑都藏在这几种里。
 * ============================================================================
 */

//%driver | 01
/* 验证公共定义（只用本模块的函数） */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8 };
    ElementType b[] = { 3, 1, 2 };
    int i;

    printf("sizeof(ElementType) = %d 字节\n", (int)sizeof(ElementType));
    printf("CUTOFF = %d —— 区间比它短就改用插入排序\n\n", CUTOFF);

    printf("插入排序前: ");
    for (i = 0; i < 3; i++) printf("%d ", b[i]);
    printf("\n");
    InsertionSort(b, 3);
    printf("插入排序后: ");
    for (i = 0; i < 3; i++) printf("%d ", b[i]);
    printf("\n\n");

    Swap(&a[0], &a[4]);
    printf("Swap 之后 a[0]=%d, a[4]=%d\n", a[0], a[4]);
    printf("（快排用 Swap 把元素换到相隔很远的位置 —— 这也是它不稳定的原因）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 Median3：三数取中，且把边界排好 */
int main(void)
{
    /* 已经有序的数据 —— 正是一般主元选择会退化的那种 */
    ElementType a[] = { 1, 2, 3, 4, 5, 6, 7 };
    ElementType b[] = { 7, 6, 5, 4, 3, 2, 1 };
    ElementType c[] = { 5, 1, 9, 3, 7 };
    ElementType p;
    int i;

    printf("数组 a（已有序）: [");
    for (i = 0; i < 7; i++) printf("%d%s", a[i], i < 6 ? ", " : "");
    printf("]\n");
    p = Median3(a, 0, 6);
    printf("  三数取中：最左 %d，中间 %d，最右 %d\n", 1, 4, 7);
    printf("  选出主元 = %d\n", p);
    printf("  主元被换到 A[5] = %d\n\n", a[5]);

    printf("数组 b（完全逆序）: [");
    for (i = 0; i < 7; i++) printf("%d%s", b[i], i < 6 ? ", " : "");
    printf("]\n");
    p = Median3(b, 0, 6);
    printf("  选出主元 = %d\n\n", p);

    printf("数组 c: [");
    for (i = 0; i < 5; i++) printf("%d%s", c[i], i < 4 ? ", " : "");
    printf("]\n");
    p = Median3(c, 0, 4);
    printf("  选出主元 = %d（三个数是 5、9、7，中间的是 7）\n\n", p);

    printf("副产品：做完之后 A[Left] <= 主元 <= A[Right]\n");
    printf("所以 A[Left] 和 A[Right] 成了天然的哨兵 ——\n");
    printf("划分循环里不用再写边界检查\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 Partition：主元永久到位，左边都小右边都大 */
int main(void)
{
    ElementType a[] = { 3, 1, 4, 5, 8, 9, 6 };
    ElementType pivot;
    int pos;
    int i;
    int leftOk = 1;
    int rightOk = 1;

    printf("划分前: [");
    for (i = 0; i < 7; i++) printf("%d%s", a[i], i < 6 ? ", " : "");
    printf("]\n");

    pivot = Median3(a, 0, 6);
    printf("主元 = %d（5、8、6 三个数里中间的那个是 6）\n", pivot);

    pos = Partition(a, 0, 6, pivot);

    printf("划分后: [");
    for (i = 0; i < 7; i++) printf("%d%s", a[i], i < 6 ? ", " : "");
    printf("]\n");
    printf("主元 %d 在下标 %d\n\n", a[pos], pos);

    for (i = 0; i < pos; i++) if (a[i] > a[pos]) leftOk = 0;
    for (i = pos + 1; i < 7; i++) if (a[i] < a[pos]) rightOk = 0;

    printf("左边都比主元小: %s\n", leftOk ? "是" : "不是");
    printf("右边都比主元大: %s\n", rightOk ? "是" : "不是");
    printf("（主元从此永久到位，递归时不用再管它）\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 QSort */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8, 3, 9, 0, 7, 6 };
    int n = 10;
    int i;

    printf("原始: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");

    QSort(a, 0, n - 1);

    printf("QSort 后: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");
    printf("有序: %s\n", IsSorted(a, n) ? "是" : "不是");

    printf("\n（区间短于 CUTOFF=%d 时改用插入排序 —— 省掉递归开销）\n", CUTOFF);

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 QuickSort：三种数据都要对 */
int main(void)
{
    ElementType a1[] = { 5, 1, 4, 2, 8, 3, 9, 0, 7, 6 };
    ElementType a2[] = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    ElementType a3[] = { 3, 3, 1, 3, 2, 3, 1, 2, 3, 3 };
    ElementType a4[] = { 5 };
    ElementType a5[1];
    int n = 10;

    QuickSort(a1, n);
    printf("随机数据  → 有序: %s\n", IsSorted(a1, n) ? "是" : "不是");

    QuickSort(a2, n);
    printf("已有序    → 有序: %s\n", IsSorted(a2, n) ? "是" : "不是");
    printf("  （如果主元取第一个元素，这种输入会退化成 O(n^2)，三数取中避免了）\n");

    QuickSort(a3, n);
    printf("大量重复  → 有序: %s\n", IsSorted(a3, n) ? "是" : "不是");
    printf("  （`while (A[++i] < Pivot)` 先加后比，遇到等于主元的会停下交换）\n");

    QuickSort(a4, 1);
    printf("只有一个  → 有序: %s\n", IsSorted(a4, 1) ? "是" : "不是");

    QuickSort(a5, 0);
    printf("空数组    → 直接返回（N<2 挡住的，否则 Right=-1 会越界）\n");

    return 0;
}
//%driver-end

//%driver | 06
/* 验证 PrintArray 与 IsSorted */
int main(void)
{
    ElementType a[] = { 1, 2, 3, 4, 5 };
    ElementType b[] = { 1, 3, 2, 4, 5 };
    ElementType c[] = { 7 };

    printf("a = "); PrintArray(a, 5);
    printf("  有序: %s\n", IsSorted(a, 5) ? "是" : "不是");

    printf("b = "); PrintArray(b, 5);
    printf("  有序: %s（3 和 2 颠倒了）\n", IsSorted(b, 5) ? "是" : "不是");

    printf("c = "); PrintArray(c, 1);
    printf("  有序: %s\n", IsSorted(c, 1) ? "是" : "不是");

    printf("\n（快排的 bug 常常只在特定排列下暴露，所以每改一次都要验）\n");

    return 0;
}
//%driver-end
