/*
 * ============================================================================
 *  06 散列 / 06-02 开放地址法 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用一批"散列位置集中"的关键字，好把三种探测方式的差别放大。
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与建表（只用本模块的函数） */
int main(void)
{
    HashTable H = CreateTable(9);
    int i;

    printf("要求表长 9，实际得到 %d（取了不小于 9 的素数）\n", H->TableSize);
    printf("（素数表长能让除留余数法的分布更均匀）\n\n");

    printf("新建的表全是空: ");
    for (i = 0; i < H->TableSize && i < 11; i++) printf("%s ", H->Cells[i].Info == Empty ? "-" : "?");
    printf("\n\n");

    printf("开放地址法 vs 分离链接法：\n");
    printf("  开放地址法：所有元素在同一个数组里，冲突就另找空位\n");
    printf("              数组必须开得比元素多，留空位给探测\n");
    printf("  分离链接法：数组每格挂一条链表，冲突就挂上去\n");
    printf("\n开放地址法不需要指针、对缓存友好，实测往往更快\n");

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 02
/* 验证 Hash 与 Hash2（第二个函数必须不为 0） */
int main(void)
{
    ElementType keys[] = { 20, 31, 42, 53, 64, 75 };
    int n = 6;
    int size = NextPrime(9);
    int i;

    printf("表长 = %d\n\n", size);

    printf("%-8s %-10s %-10s\n", "关键字", "h(k)", "h2(k)");
    printf("-------- ---------- ----------\n");
    for (i = 0; i < n; i++)
    {
        printf("%-8d %-10d %-10d\n", keys[i],
               Hash(keys[i], size), Hash2(keys[i], size));
    }

    printf("\n注意两件事：\n");
    printf("  ① 这批关键字的 h(k) 全部相同 —— 全都撞在一起\n");
    printf("  ② h2(k) 各不相同 —— 这正是双散列能打散它们的原因\n\n");

    printf("h2(k) 必须不为 0，否则探测序列原地打转：\n");
    for (i = 0; i < n; i++)
    {
        int h2 = Hash2(keys[i], size);
        if (h2 == 0) printf("  !! 关键字 %d 的 h2 = 0，有 bug\n", keys[i]);
    }
    printf("  检查完毕：全部在 [1, %d] 范围内\n", size - 1);

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 FindLinear：手工填入元素，再线性探测查找 */
int main(void)
{
    HashTable H = CreateTable(9);
    ElementType keys[] = { 20, 31, 42 };
    int i, probes;
    int pos;
    Index h;

    /* 手工按线性探测填入 —— 不调用 InsertLinear，避免依赖倒置 */
    for (i = 0; i < 3; i++)
    {
        int k = 0;
        h = Hash(keys[i], H->TableSize);
        while (H->Cells[(h + k) % H->TableSize].Info == Legitimate) k++;
        H->Cells[(h + k) % H->TableSize].Data = keys[i];
        H->Cells[(h + k) % H->TableSize].Info = Legitimate;
    }

    PrintTable(H);
    printf("（20、31、42 都散列到 9 号格，被依次挤到了 9、10、0）\n\n");

    for (i = 0; i < 3; i++)
    {
        pos = FindLinear(H, keys[i], &probes);
        printf("找 %d: 位置 %d，探测 %d 次\n", keys[i], pos, probes);
    }

    pos = FindLinear(H, 999, &probes);
    printf("找 999（不存在）: %s，探测 %d 次\n", pos < 0 ? "没找到" : "找到了", probes);
    printf("（找不到时会一直探测到空位才停 —— 这就是「遇到 Empty 就停」）\n");

    DestroyTable(H);
    return 0;
}
//%driver-end


//%driver | 04
/* 验证 InsertLinear 与 DeleteLinear（墓碑） */
int main(void)
{
    HashTable H = CreateTable(9);
    ElementType keys[] = { 20, 31, 42 };
    int i, probes, pos;

    for (i = 0; i < 3; i++)
    {
        pos = InsertLinear(H, keys[i], &probes);
        printf("插入 %d → 位置 %d（探测 %d 次）\n", keys[i], pos, probes);
    }
    PrintTable(H);

    printf("\n删除 31: %s\n", DeleteLinear(H, 31) == OK ? "成功" : "失败");
    PrintTable(H);
    printf("（31 的位置变成 X —— 墓碑，不是 Empty）\n\n");

    pos = FindLinear(H, 42, &probes);
    printf("再找 42: 位置 %d，探测 %d 次\n", pos, probes);
    printf("（还能找到 —— 查找遇到墓碑会继续往后走）\n\n");

    printf("如果把删除的格子标成 Empty 会怎样？\n");
    printf("  查 42 时走到 10 号格发现 Empty，会以为后面没有了 → 报「不存在」\n");
    printf("  但 42 明明在 0 号格！这就是「墓碑」存在的意义\n");

    printf("\n重复插入 20: ");
    pos = InsertLinear(H, 20, &probes);
    printf("位置 %d（不会插入第二个 20）\n", pos);

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 FindQuadratic */
int main(void)
{
    HashTable H = CreateTable(11);
    ElementType keys[] = { 20, 31, 42, 53, 64, 75 };
    int n = 6;
    int i, probes, k;
    Index CurrentPos, NewPos;

    printf("表长 = %d（11 = 4×2+3，是 4k+3 形式的素数）\n", H->TableSize);
    printf("（平方探测要表长满足这个条件才能覆盖全表）\n\n");

    /* 手工用平方探测插入 */
    for (i = 0; i < n; i++)
    {
        CurrentPos = Hash(keys[i], H->TableSize);
        NewPos = CurrentPos;
        k = 0;
        while (H->Cells[NewPos].Info == Legitimate)
        {
            k++;
            int offset = ((k + 1) / 2) * ((k + 1) / 2) * ((k % 2) ? 1 : -1);
            NewPos = (CurrentPos + offset) % H->TableSize;
            while (NewPos < 0) NewPos += H->TableSize;
        }
        H->Cells[NewPos].Data = keys[i];
        H->Cells[NewPos].Info = Legitimate;
    }

    PrintTable(H);
    printf("（注意元素是「跳着」分布的，没有连成一片）\n\n");

    for (i = 0; i < 3; i++)
    {
        int pos = FindQuadratic(H, keys[i], &probes);
        printf("找 %d: 位置 %d，探测 %d 次\n", keys[i], pos, probes);
    }

    printf("\n平方探测的两个问题：\n");
    printf("  ① 二次聚集：散列到同一起点的元素仍走同一条序列\n");
    printf("  ② 表长必须是 4k+3 形式的素数，否则有些格永远试不到\n");

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 FindDouble */
int main(void)
{
    HashTable H = CreateTable(11);
    ElementType keys[] = { 20, 31, 42, 53, 64, 75 };
    int n = 6;
    int i, probes, k;
    Index CurrentPos, NewPos, step;

    printf("表长 = %d\n\n", H->TableSize);

    /* 手工用双散列插入 */
    for (i = 0; i < n; i++)
    {
        CurrentPos = Hash(keys[i], H->TableSize);
        NewPos = CurrentPos;
        step = Hash2(keys[i], H->TableSize);
        k = 0;
        while (H->Cells[NewPos].Info == Legitimate)
        {
            k++;
            NewPos = (CurrentPos + k * step) % H->TableSize;
        }
        H->Cells[NewPos].Data = keys[i];
        H->Cells[NewPos].Info = Legitimate;
    }

    PrintTable(H);
    printf("\n每个关键字的探测路径：\n");
    for (i = 0; i < 3; i++)
    {
        Index h = Hash(keys[i], H->TableSize);
        Index s = Hash2(keys[i], H->TableSize);
        printf("  %d: 起点 %d，步长 %d → 路径 %d, %d, %d, ...\n",
               keys[i], h, s, h, (h + s) % H->TableSize, (h + 2 * s) % H->TableSize);
    }
    printf("（起点相同，但步长不同 → 走的路子完全不一样）\n\n");

    for (i = 0; i < 3; i++)
    {
        int pos = FindDouble(H, keys[i], &probes);
        printf("找 %d: 位置 %d，探测 %d 次\n", keys[i], pos, probes);
    }

    printf("\n双散列效果最好（既无一次聚集，也无二次聚集）\n");
    printf("代价是多算一个散列函数，而且 h2(k) 必须保证不为 0\n");

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证 PrintTable 与 LoadFactor */
int main(void)
{
    HashTable H = CreateTable(9);
    ElementType keys[] = { 20, 31, 42, 53 };
    int i, probes;

    printf("装填因子（空表）= %.2f\n\n", LoadFactor(H));

    for (i = 0; i < 4; i++)
    {
        InsertLinear(H, keys[i], &probes);
        printf("插入 %d 之后装填因子 = %.2f\n", keys[i], LoadFactor(H));
    }

    printf("\n");
    PrintTable(H);

    printf("\n装填因子越高，冲突越多：\n");
    printf("  线性探测平均探测次数约 (1 + 1/(1-α)) / 2\n");
    printf("  α=0.5 → 1.5 次；α=0.75 → 2.5 次；α=0.9 → 5.5 次\n");
    printf("  所以开放地址法的表不能装太满，α 到 0.75 就该扩容\n");

    DestroyTable(H);
    return 0;
}
//%driver-end
