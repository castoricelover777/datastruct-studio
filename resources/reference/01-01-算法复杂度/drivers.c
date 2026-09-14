/*
 * ============================================================================
 *  01 引论 / 01-01 算法复杂度 —— 练习模式的测试驱动
 * ============================================================================
 *  本文件不参与编译（每个驱动都是独立的 main），只是脚手架的数据源。
 * ============================================================================
 */

//%driver | 01
/* 验证 countConst：不管 n 多大，都应该只加 1 次 */
int main(void)
{
    int n;

    printf("n\tcountConst(n)\n");
    for (n = 1; n <= 1000; n *= 10)
    {
        printf("%d\t%ld\n", n, countConst(n));
    }
    printf("（答案与 n 无关，所以是 O(1)）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 countLinear：返回值应该正好等于 n */
int main(void)
{
    int n;

    printf("n\tcountLinear(n)\t等于 n 吗\n");
    for (n = 1; n <= 1000; n *= 10)
    {
        long c = countLinear(n);
        printf("%d\t%ld\t\t%s\n", n, c, c == n ? "是" : "否");
    }
    printf("（与 n 成正比，所以是 O(n)）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 countQuadratic：返回值应该正好等于 n 的平方 */
int main(void)
{
    int n;

    printf("n\tcountQuadratic(n)\tn*n\n");
    for (n = 10; n <= 1000; n *= 10)
    {
        long c = countQuadratic(n);
        printf("%d\t%ld\t\t\t%ld\n", n, c, (long)n * n);
    }
    printf("（注意 n 每涨 10 倍，次数涨 100 倍）\n");

    return 0;
}
//%driver-end
