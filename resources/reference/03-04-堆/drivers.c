/*
 * ============================================================================
 *  03 树 / 03-04 堆 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与下标关系（只用类型本身，不调用任何函数） */
int main(void)
{
    MinHeap H;
    int i;

    H.size = 0;
    H.capacity = 10;

    printf("sizeof(MinHeap) = %d 字节\n", (int)sizeof(MinHeap));
    printf("一个堆 = 数组指针 + 当前个数 + 容量上限\n\n");

    printf("下标关系（1 起始）:\n");
    for (i = 1; i <= 3; i++)
    {
        printf("  结点 %d：左孩子 %d，右孩子 %d，父亲 %d\n", i, 2 * i, 2 * i + 1, i / 2);
    }
    printf("\n0 号位置空着放哨兵 MINDATA = %d\n", MINDATA);
    printf("（整棵树就是一段连续内存，一个指针都不用）\n");

    return 0;
}
//%driver-end


//%driver | 02
/* 验证 CreateHeap：空堆、哨兵就位 */
int main(void)
{
    MinHeap *H = CreateHeap(5);

    printf("新建的堆：size = %d\n", H->size);
    printf("data[0] = %d（哨兵）\n", H->data[0]);
    printf("空堆时没有任何元素，但数组和哨兵已经准备好了\n");

    /* 手工放一个元素试试 */
    H->data[++H->size] = 7;
    printf("放入一个 7 之后 size = %d，堆顶 = %d\n", H->size, H->data[1]);

    FreeHeap(H);
    return 0;
}
//%driver-end

//%driver | 03
/* 验证 PercDown：把不合适的元素一路沉下去 */
int main(void)
{
    MinHeap *H = CreateHeap(20);
    int i;

    /* 手工摆一个"根不合规矩"的堆：根是 8，其余是合法的小堆 */
    H->data[1] = 8;
    H->data[2] = 3;
    H->data[3] = 2;
    H->data[4] = 6;
    H->data[5] = 7;
    H->data[6] = 5;
    H->size = 6;

    printf("下沉前: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n（根 8 比孩子大，不合规矩）\n");

    PercDown(H, 1);

    printf("下沉后: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n（8 一直沉到没有孩子为止）\n");
    printf("检查: %s\n", CheckHeap(H) ? "合法" : "不合法");

    FreeHeap(H);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 PercUp：把过小的元素一路顶上去 */
int main(void)
{
    MinHeap *H = CreateHeap(20);
    int i;

    /* 末尾放一个 0，它应该一路浮到根 */
    H->data[1] = 1;
    H->data[2] = 3;
    H->data[3] = 2;
    H->data[4] = 6;
    H->data[5] = 7;
    H->data[6] = 5;
    H->data[7] = 0;
    H->size = 7;

    printf("上浮前: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n（末尾的 0 太小了）\n");

    PercUp(H, 7);

    printf("上浮后: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n（0 比父亲小就换位，一路浮到顶上）\n");
    printf("检查: %s\n", CheckHeap(H) ? "合法" : "不合法");

    FreeHeap(H);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 BuildHeap：随便一堆数整理成堆 */
int main(void)
{
    MinHeap *H = CreateHeap(20);
    static const int a[] = { 6, 3, 7, 1, 5, 2, 4 };
    int i;

    for (i = 0; i < 7; i++) H->data[++H->size] = a[i];

    printf("原始数组: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n检查堆序: %s（还不是堆）\n", CheckHeap(H) ? "合法" : "不合法");

    BuildHeap(H);

    printf("建堆之后: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n堆顶 = %d（一定是最小值）\n", H->data[1]);
    printf("检查堆序: %s\n", CheckHeap(H) ? "合法" : "不合法");
    printf("（从 n/2 往前逐个下沉，整体是 O(n) 而不是 O(n log n)）\n");

    FreeHeap(H);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 Insert：放末尾再上浮 */
int main(void)
{
    MinHeap *H = CreateHeap(20);
    static const int a[] = { 6, 3, 7, 1, 5, 2, 4 };
    int i;

    for (i = 0; i < 7; i++) H->data[++H->size] = a[i];
    BuildHeap(H);

    printf("插入前: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("（堆顶 %d）\n", H->data[1]);

    Insert(H, 0);
    printf("插入 0 后: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n堆顶 = %d（0 浮上来了）\n", H->data[1]);
    printf("检查堆序: %s\n", CheckHeap(H) ? "合法" : "不合法");

    FreeHeap(H);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证 DeleteMin：搬到根再下沉 */
int main(void)
{
    MinHeap *H = CreateHeap(20);
    static const int a[] = { 6, 3, 7, 1, 5, 2, 4 };
    int i;

    for (i = 0; i < 7; i++) H->data[++H->size] = a[i];
    BuildHeap(H);

    printf("删除前: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n");

    printf("\n连续删除最小值: ");
    for (i = 0; i < 3; i++) printf("%d ", DeleteMin(H));
    printf("\n");
    printf("剩下的: ");
    for (i = 1; i <= H->size; i++) printf("%d ", H->data[i]);
    printf("\n堆顶 = %d\n", H->data[1]);
    printf("检查堆序: %s\n", CheckHeap(H) ? "合法" : "不合法");

    printf("\n继续删到空: ");
    while (H->size > 0) printf("%d ", DeleteMin(H));
    printf("\n（输出一定递增 —— 这就是堆排序的雏形）\n");

    FreeHeap(H);
    return 0;
}
//%driver-end

//%driver | 08
/* 验证 PrintHeap 与 CheckHeap */
int main(void)
{
    MinHeap *H = CreateHeap(20);
    static const int a[] = { 6, 3, 7, 1, 5, 2, 4 };
    int i;

    for (i = 0; i < 7; i++) H->data[++H->size] = a[i];

    PrintHeap("建堆前:", H);
    printf("检查堆序: %s\n", CheckHeap(H) ? "合法" : "不合法");

    BuildHeap(H);
    PrintHeap("建堆后:", H);
    printf("检查堆序: %s\n", CheckHeap(H) ? "合法" : "不合法");
    printf("（只看数组打印是看不出堆序的，所以要专门检查父子关系）\n");

    FreeHeap(H);
    return 0;
}
//%driver-end
