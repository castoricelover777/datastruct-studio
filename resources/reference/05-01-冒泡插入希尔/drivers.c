/*
 * ============================================================================
 *  05 排序 / 05-01 冒泡、插入、希尔 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用 { 5, 1, 4, 2, 8, 3, 9, 0, 7, 6 }（10 个元素，逆序对 45 个里的 22 个）
 * ============================================================================
 */

//%driver | 01
/* 验证公共定义（只用本模块的函数） */
int main(void)
{
    ElementType a[5];
    ElementType x = 3;
    ElementType y = 7;

    a[0] = 5;
    a[1] = 1;
    a[2] = 4;
    a[3] = 2;
    a[4] = 8;

    printf("sizeof(ElementType) = %d 字节\n", (int)sizeof(ElementType));
    printf("（排序算法和「排什么」无关，所以把类型单独定义，改一行就能换）\n\n");

    printf("交换前: x = %d, y = %d\n", x, y);
    Swap(&x, &y);
    printf("交换后: x = %d, y = %d\n", x, y);
    printf("（Swap 的参数必须是指针 —— C 是值传递，传值只能改副本）\n\n");

    printf("数组最小值 = %d，最大值 = %d\n", MinOf(a, 5), MaxOf(a, 5));

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 BubbleSort：每轮最大的被送到末尾 */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8, 3, 9, 0, 7, 6 };
    int n = 10;

    printf("原始:     ");
    PrintArray(a, n);
    printf("\n逆序对 = %d\n\n", CountInversions(a, n));

    BubbleSort(a, n);

    printf("冒泡之后: ");
    PrintArray(a, n);
    printf("\n有序: %s\n", IsSorted(a, n) ? "是" : "不是");
    printf("\n（每一轮都把当前范围内最大的换到了末尾，所以「已排好」的部分每轮多一个）\n");
    printf("（内层循环的上界就跟着减一 —— 已经排好的不用再看）\n");

    /* 已经有序的输入应该很快 */
    printf("\n再来一次（这次已经有序）：");
    BubbleSort(a, n);
    PrintArray(a, n);
    printf("\n（flag 检测到一趟没交换就提前收工了）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 InsertionSort：用后移代替交换 */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8, 3, 9, 0, 7, 6 };
    int n = 10;
    int inv;

    printf("原始:     ");
    PrintArray(a, n);
    inv = CountInversions(a, n);
    printf("\n逆序对 = %d\n\n", inv);

    InsertionSort(a, n);

    printf("插入之后: ");
    PrintArray(a, n);
    printf("\n有序: %s\n", IsSorted(a, n) ? "是" : "不是");

    printf("\n插入排序的移动次数恰好等于逆序对数（%d）\n", inv);
    printf("（每消除一个逆序对就移动一次 —— 这是它「近乎有序就快」的根本原因）\n");
    printf("\n和冒泡的区别：\n");
    printf("  冒泡交换一次 = 3 次赋值\n");
    printf("  插入后移一次 = 1 次赋值\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 ShellSort */
int main(void)
{
    ElementType a[] = { 5, 1, 4, 2, 8, 3, 9, 0, 7, 6 };
    /* 一个更极端的例子：最小值在最后 */
    ElementType b[] = { 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 };
    int n = 10;

    printf("原始:     ");
    PrintArray(a, n);
    printf("\n");

    ShellSort(a, n);

    printf("希尔之后: ");
    PrintArray(a, n);
    printf("\n有序: %s\n", IsSorted(a, n) ? "是" : "不是");

    printf("\n增量序列是 5 → 2 → 1：\n");
    printf("  d=5 时分成 5 组，每组 2 个元素，组内排序\n");
    printf("  d=2 时分成 2 组，每组 5 个元素\n");
    printf("  d=1 时就是普通插入排序 —— 但数组已经基本有序了\n\n");

    printf("再来一个完全逆序的 { 9..0 }：\n  ");
    PrintArray(b, n);
    printf("  （逆序对 = %d，最多的那种）\n", CountInversions(b, n));
    ShellSort(b, n);
    printf("  希尔之后: ");
    PrintArray(b, n);
    printf("\n  有序: %s\n", IsSorted(b, n) ? "是" : "不是");
    printf("\n（这里更能看出希尔的价值：插入排序面对完全逆序会一格一格挪）\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 PrintArray / IsSorted / CountInversions */
int main(void)
{
    ElementType a[] = { 1, 2, 3, 4, 5 };
    ElementType b[] = { 5, 4, 3, 2, 1 };
    ElementType c[] = { 3, 1, 2 };

    printf("数组一: ");
    PrintArray(a, 5);
    printf("  有序: %s，逆序对 = %d\n", IsSorted(a, 5) ? "是" : "不是", CountInversions(a, 5));

    printf("数组二: ");
    PrintArray(b, 5);
    printf("  有序: %s，逆序对 = %d\n", IsSorted(b, 5) ? "是" : "不是", CountInversions(b, 5));

    printf("数组三: ");
    PrintArray(c, 3);
    printf("  有序: %s，逆序对 = %d\n", IsSorted(c, 3) ? "是" : "不是", CountInversions(c, 3));

    printf("\n逆序对最多是 n(n-1)/2：n=5 时最多 %d 个\n", 5 * 4 / 2);
    printf("（完全逆序就是最多，已经有序就是 0）\n");
    printf("（所以逆序对数就是「这个数组离有序有多远」的度量）\n");

    return 0;
}
//%driver-end
