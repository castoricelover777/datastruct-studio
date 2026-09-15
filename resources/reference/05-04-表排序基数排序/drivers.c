/*
 * ============================================================================
 *  05 排序 / 05-04 表排序、基数排序 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证公共定义（只用本模块的类型和宏） */
int main(void)
{
    ElementType a[3];

    a[0] = 1234;
    a[1] = 5;
    a[2] = 21;

    printf("sizeof(ElementType) = %d 字节\n", (int)sizeof(ElementType));
    printf("RADIX = %d，MAXD = %d，MAXN = %d\n\n", RADIX, MAXD, MAXN);

    printf("表排序为什么有用：元素可能有几百字节，而一个下标只有 4 字节\n");
    printf("  搬 1000 个 500 字节的结构体 vs 搬 1000 个 int —— 差上百倍\n\n");

    printf("基数排序的复杂度 O(d(n+r))：\n");
    printf("  d 是最大位数（%d），r 是基数（%d）\n", MAXD, RADIX);
    printf("  只要 d 是常数，它就是**线性**的 —— 和 n log n 无关\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 TableSort：A 不动，table 指出有序的访问顺序 */
int main(void)
{
    ElementType a[] = { 30, 10, 40, 20, 50 };
    int table[5];
    int i;

    printf("原始 A: [");
    for (i = 0; i < 5; i++) printf("%d%s", a[i], i < 4 ? ", " : "");
    printf("]\n\n");

    TableSort(a, 5, table);

    printf("排完之后 A:     [");
    for (i = 0; i < 5; i++) printf("%d%s", a[i], i < 4 ? ", " : "");
    printf("]   ← 一个都没动\n");

    printf("table:          [");
    for (i = 0; i < 5; i++) printf("%d%s", table[i], i < 4 ? ", " : "");
    printf("]\n");

    printf("按 table 读 A:  ");
    PrintByTable(a, table, 5);
    printf("   ← 有序了\n");

    printf("按 table 读是有序: %s\n", IsSortedByTable(a, table, 5) ? "是" : "不是");
    printf("（最小的 10 在下标 1，所以 table[0] = 1）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 Rearrange：环移动，原地重排 */
int main(void)
{
    ElementType a[] = { 30, 10, 40, 20, 50 };
    ElementType b[] = { 3, 1, 2 };
    int table[5];
    int tb[3];
    int i;

    printf("=== 五个元素的例子 ===\n");
    printf("重排前 A: [");
    for (i = 0; i < 5; i++) printf("%d%s", a[i], i < 4 ? ", " : "");
    printf("]\n");

    TableSort(a, 5, table);
    printf("table:    [");
    for (i = 0; i < 5; i++) printf("%d%s", table[i], i < 4 ? ", " : "");
    printf("]\n");

    Rearrange(a, 5, table);

    printf("重排后 A: [");
    for (i = 0; i < 5; i++) printf("%d%s", a[i], i < 4 ? ", " : "");
    printf("]   %s\n\n", IsSorted(a, 5) ? "有序 ✓" : "还是乱的 ✗");

    printf("=== 一个更小的环（两个元素互换）===\n");
    printf("重排前 B: [");
    for (i = 0; i < 3; i++) printf("%d%s", b[i], i < 2 ? ", " : "");
    printf("]\n");

    TableSort(b, 3, tb);
    printf("table:    [");
    for (i = 0; i < 3; i++) printf("%d%s", tb[i], i < 2 ? ", " : "");
    printf("]\n");

    Rearrange(b, 3, tb);
    printf("重排后 B: [");
    for (i = 0; i < 3; i++) printf("%d%s", b[i], i < 2 ? ", " : "");
    printf("]\n\n");

    printf("（环移动是原地完成的 —— 每个元素最多搬一次，O(n)，不用额外数组）\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 GetDigit */
int main(void)
{
    int x = 1234;
    int i;

    printf("取 %d 的每一位：\n", x);
    for (i = 1; i <= MAXD; i++)
    {
        printf("  第 %d 位（%s位）= %d\n", i,
               i == 1 ? "个" : i == 2 ? "十" : i == 3 ? "百" : "千",
               GetDigit(x, i));
    }

    printf("\n再试几个：\n");
    printf("  GetDigit(5, 1)    = %d\n", GetDigit(5, 1));
    printf("  GetDigit(5, 3)    = %d（高位补 0）\n", GetDigit(5, 3));
    printf("  GetDigit(1000, 4) = %d\n", GetDigit(1000, 4));
    printf("  GetDigit(99, 2)   = %d\n", GetDigit(99, 2));

    printf("\n做法：先除以 10 共 d-1 次把目标位移到个位，再 %%10\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 RadixSort：整个过程一次比较都没有 */
int main(void)
{
    ElementType a[] = { 1234, 5, 21, 0, 99, 1000, 7, 456 };
    ElementType c[8];
    int n = 8;
    int count[RADIX];
    ElementType buckets[RADIX][MAXN];
    ElementType tmp[MAXN];
    int d, i, j, di, pos;

    printf("原始: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n\n");

    /* 手工演示前两轮 */
    for (i = 0; i < n; i++) c[i] = a[i];
    for (d = 1; d <= 2; d++)
    {
        for (i = 0; i < RADIX; i++) count[i] = 0;
        for (i = 0; i < n; i++)
        {
            di = GetDigit(c[i], d);
            buckets[di][count[di]++] = c[i];
        }
        pos = 0;
        for (i = 0; i < RADIX; i++)
            for (j = 0; j < count[i]; j++) tmp[pos++] = buckets[i][j];
        for (i = 0; i < n; i++) c[i] = tmp[i];

        printf("第 %d 轮（看%s位）: [", d, d == 1 ? "个" : "十");
        for (i = 0; i < n; i++) printf("%d%s", c[i], i < n - 1 ? ", " : "");
        printf("]\n");
    }
    printf("\n");

    RadixSort(a, n);

    printf("4 轮排完: [");
    for (i = 0; i < n; i++) printf("%d%s", a[i], i < n - 1 ? ", " : "");
    printf("]\n");
    printf("有序: %s\n\n", IsSorted(a, n) ? "是" : "不是");

    printf("为什么低位优先能对？因为「分配-收集」是稳定的：\n");
    printf("  同一个桶里先进去的先被取出来，所以上一轮排好的顺序不会乱\n");
    printf("  三轮之后 = 先比百位、相同再看十位、再相同看个位 —— 正是完全有序\n");

    return 0;
}
//%driver-end

//%driver | 06
/* 验证 PrintArray / IsSorted / PrintByTable / IsSortedByTable */
int main(void)
{
    ElementType a[] = { 30, 10, 40, 20 };
    ElementType b[] = { 1, 2, 3, 4 };
    int table[4];
    int i;

    printf("a = "); PrintArray(a, 4);
    printf("  有序: %s\n", IsSorted(a, 4) ? "是" : "不是");

    printf("b = "); PrintArray(b, 4);
    printf("  有序: %s\n\n", IsSorted(b, 4) ? "是" : "不是");

    TableSort(a, 4, table);
    printf("表排序 a 之后：\n");
    printf("  A 本身:       "); PrintArray(a, 4);
    printf("  ← 还是乱的\n");
    printf("  按 table 读:  "); PrintByTable(a, table, 4);
    printf("  ← 有序\n");
    printf("  IsSorted(A)          = %s  ← 直接看数组是乱的\n", IsSorted(a, 4) ? "真" : "假");
    printf("  IsSortedByTable(A)   = %s  ← 按 table 看才有意义\n",
           IsSortedByTable(a, table, 4) ? "真" : "假");
    printf("\n（这就是表排序的特点：数组乱着，但「访问顺序」是有序的）\n");

    (void)i;
    return 0;
}
//%driver-end
