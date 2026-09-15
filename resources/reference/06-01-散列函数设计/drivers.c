/*
 * ============================================================================
 *  06 散列 / 06-01 散列函数设计 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义（只用本模块的类型和 DestroyTable） */
int main(void)
{
    HashTable H = (HashTable)malloc(sizeof(struct TblNode));
    int i;

    H->TableSize = 5;
    H->Cells = (Cell *)malloc(5 * sizeof(Cell));

    for (i = 0; i < 5; i++)
    {
        H->Cells[i].Info = Empty;
        H->Cells[i].Data = 0;
    }
    H->Cells[2].Data = 42;
    H->Cells[2].Info = Legitimate;
    H->Cells[3].Info = Deleted;

    printf("表长 = %d\n\n", H->TableSize);
    printf("每格有三种状态：\n");
    for (i = 0; i < 5; i++)
    {
        printf("  下标 %d: %s\n", i,
               H->Cells[i].Info == Empty ? "Empty（从没放过）" :
               H->Cells[i].Info == Legitimate ? "Legitimate（有元素）" :
               "Deleted（墓碑）");
    }

    printf("\n为什么要区分 Empty 和 Deleted？\n");
    printf("  查找时「遇到 Empty 就停」，但遇到 Deleted 必须继续往后走\n");
    printf("  如果删除的格子标成 Empty，后面的元素就再也找不到了\n");

    DestroyTable(H);
    printf("\n（DestroyTable：先 free 格子数组，再 free 表结构）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 NextPrime */
int main(void)
{
    int i;

    printf("从各个数往上找素数：\n");
    for (i = 8; i <= 20; i++)
    {
        printf("  NextPrime(%2d) = %2d\n", i, NextPrime(i));
    }

    printf("\n小素数：\n");
    printf("  NextPrime(1) = %d\n", NextPrime(1));
    printf("  NextPrime(2) = %d\n", NextPrime(2));
    printf("  NextPrime(3) = %d\n", NextPrime(3));

    printf("\n为什么表长要取素数？\n");
    printf("  表长 10（合数）+ 关键字全是偶数 → 只能落在 0 2 4 6 8\n");
    printf("  表长 11（素数）+ 同样数据     → 能落在全部 11 格上\n");
    printf("（素数和大多数数互质，余数才能均匀铺开）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 HashMod 与 HashModScramble */
int main(void)
{
    ElementType keys[] = { 100, 200, 300, 400, 500, 600, 700, 800 };
    int n = 8;
    int size = NextPrime(10);
    int i;
    int hits[64];
    int c1 = 0, c2 = 0;

    printf("关键字都是 10 的倍数，表长 = %d\n\n", size);

    for (i = 0; i < size; i++) hits[i] = 0;
    printf("HashMod（直接取余）：\n");
    for (i = 0; i < n; i++)
    {
        Index h = HashMod(keys[i], size);
        printf("  %d → %d\n", keys[i], h);
        if (hits[h] > 0) c1++;
        hits[h]++;
    }
    printf("  冲突 %d 次，分布: ", c1);
    for (i = 0; i < size; i++) printf("%d ", hits[i]);
    printf("\n\n");

    for (i = 0; i < size; i++) hits[i] = 0;
    printf("HashModScramble（先乘 31 再取余）：\n");
    for (i = 0; i < n; i++)
    {
        Index h = HashModScramble(keys[i], size);
        printf("  %d → %d\n", keys[i], h);
        if (hits[h] > 0) c2++;
        hits[h]++;
    }
    printf("  冲突 %d 次，分布: ", c2);
    for (i = 0; i < size; i++) printf("%d ", hits[i]);
    printf("\n\n");

    printf("对比：打散之后冲突从 %d 次降到 %d 次\n", c1, c2);
    printf("（关键字有规律时，直接取余会让高位差异全丢掉）\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 HashFold 与 HashMidSquare */
int main(void)
{
    long long id = 123456789LL;
    long long id2 = 987654321LL;
    int size = NextPrime(1000);

    printf("表长 = %d\n\n", size);

    printf("关键字 123456789：\n");
    printf("  直接取余          : %d（只有低位参与，高位的 123 完全没用到）\n",
           (int)(id % size));
    printf("  折叠法（每3位一段）: %d\n", HashFold(id, size, 3));
    printf("    （123 + 456 + 789 = 1368，1368 %% %d = %d）\n", size, 1368 % size);
    printf("  平方取中法        : %d\n\n", HashMidSquare(id, size, 3));

    printf("关键字 987654321：\n");
    printf("  直接取余          : %d\n", (int)(id2 % size));
    printf("  折叠法            : %d\n", HashFold(id2, size, 3));
    printf("    （987 + 654 + 321 = 1962）\n");
    printf("  平方取中法        : %d\n\n", HashMidSquare(id2, size, 3));

    printf("折叠法的好处：每一段都参与了运算，高位的差异不会丢\n");
    printf("（直接对 123456789 取余时，只有最低几位影响结果）\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 HashString：移位相加法 vs 简单求和 */
int main(void)
{
    const char *words[] = { "abc", "cba", "bca", "acb", "cab", "bac" };
    int n = 6;
    int size = NextPrime(10);
    int i;
    int sameBad = 0;
    int sameGood = 0;

    printf("表长 = %d\n\n", size);
    printf("%-8s %-14s %-14s\n", "字符串", "ASCII求和法", "移位相加法");
    printf("-------- -------------- --------------\n");

    for (i = 0; i < n; i++)
    {
        printf("%-8s %-14d %-14d\n", words[i],
               HashStringBad(words[i], size),
               HashString(words[i], size));
    }

    for (i = 1; i < n; i++)
    {
        if (HashStringBad(words[i], size) == HashStringBad(words[0], size)) sameBad++;
        if (HashString(words[i], size) == HashString(words[0], size)) sameGood++;
    }

    printf("\n和第一个撞车的个数：求和法 %d 个，移位法 %d 个\n", sameBad, sameGood);
    printf("（加法满足交换律，所以字母重新排列后和不变 → 全撞在一起）\n");
    printf("（移位法把顺序也编码进去了，所以能分开）\n\n");

    printf("注意移位法用 unsigned int 存中间结果：\n");
    printf("  左移和累加很快会溢出，无符号溢出是「回绕」（行为有定义）\n");
    printf("  有符号溢出是未定义行为 —— 所以这里必须用 unsigned\n");

    return 0;
}
//%driver-end

//%driver | 06
/* 验证 PrintTable 与 PrintStats */
int main(void)
{
    HashTable H = (HashTable)malloc(sizeof(struct TblNode));
    int m = NextPrime(10);
    ElementType keys[] = { 100, 200, 300, 400, 500, 600 };
    int i;

    H->TableSize = m;
    H->Cells = (Cell *)malloc(m * sizeof(Cell));
    for (i = 0; i < m; i++) H->Cells[i].Info = Empty;

    /* 用打散后的散列 + 线性探测塞进去 */
    for (i = 0; i < 6; i++)
    {
        Index h = HashModScramble(keys[i], m);
        int step = 0;
        while (H->Cells[(h + step) % m].Info == Legitimate) step++;
        H->Cells[(h + step) % m].Data = keys[i];
        H->Cells[(h + step) % m].Info = Legitimate;
    }

    printf("表长 = %d\n\n", m);
    PrintTable(H);
    PrintStats(H);

    printf("\n（装填因子 = 已用格数 / 表长。它越高，冲突越多）\n");
    printf("（一般建议控制在 0.5 ~ 0.75 之间，超过就该扩容了）\n");

    DestroyTable(H);
    return 0;
}
//%driver-end
