/*
 * ============================================================================
 *  06 散列 / 06-03 分离链接法 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与建表（只用本模块的函数） */
int main(void)
{
    HashTable H = CreateTable(11);
    int i;

    printf("要求表长 11，实际得到 %d\n", H->TableSize);
    printf("sizeof(struct LNode) = %d 字节（一个 int + 一个指针）\n\n",
           (int)sizeof(struct LNode));

    printf("链表头数组（每格都非空，因为用了「虚拟头结点」）：\n");
    for (i = 0; i < H->TableSize; i++)
    {
        printf("  [%2d] Next = %s\n", i, H->Heads[i].Next == NULL ? "NULL" : "?");
    }

    printf("\n虚拟头结点的好处：\n");
    printf("  ① 插入时不用特判「链表还空着」\n");
    printf("  ② 删除时不用特判「删的是第一个结点」\n");
    printf("  （省掉一堆 if，代码短很多）\n");

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 02
/* 验证 Hash 与 LoadFactor */
int main(void)
{
    static const ElementType keys[] = { 11, 22, 33, 44 };
    HashTable H = CreateTable(11);
    int i;

    printf("表长 = %d\n\n", H->TableSize);

    printf("这几个关键字都能被 11 整除：\n");
    for (i = 0; i < 4; i++)
    {
        printf("  %d %% %d = %d\n", keys[i], H->TableSize, Hash(keys[i], H->TableSize));
    }
    printf("（全都落在 0 号桶 —— 这就是「散列函数选得差」的情形）\n\n");

    printf("空表装填因子 = %.2f\n", LoadFactor(H));
    printf("（分离链接法的装填因子 = 平均链表长度，**可以大于 1**）\n");

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 03
/* 验证 Find：先散列定位，再顺链找 */
int main(void)
{
    HashTable H = CreateTable(11);
    static const ElementType keys[] = { 11, 22, 33 };
    static const ElementType others[] = { 5, 16 };
    Position P;
    int i;

    /* 手工挂上去（不调用 Insert，避免依赖倒置） */
    for (i = 0; i < 3; i++)
    {
        int pos = Hash(keys[i], H->TableSize);
        Position node = (Position)malloc(sizeof(struct LNode));
        node->Data = keys[i];
        node->Next = H->Heads[pos].Next;
        H->Heads[pos].Next = node;
    }
    for (i = 0; i < 2; i++)
    {
        int pos = Hash(others[i], H->TableSize);
        Position node = (Position)malloc(sizeof(struct LNode));
        node->Data = others[i];
        node->Next = H->Heads[pos].Next;
        H->Heads[pos].Next = node;
    }

    PrintTable(H);
    printf("\n");

    for (i = 0; i < 2; i++)
    {
        P = Find(H, others[i]);
        printf("找 %d: %s\n", others[i], P ? "找到了" : "没找到");
    }
    for (i = 0; i < 3; i++)
    {
        P = Find(H, keys[i]);
        printf("找 %d: %s\n", keys[i], P ? "找到了" : "没找到");
    }
    P = Find(H, 999);
    printf("找 999（不存在）: %s\n", P ? "找到了" : "没找到");

    printf("\n查找两步：① 散列算出挂哪条链  ② 顺着链表比\n");
    printf("所以代价 = O(1) + O(链表长度) = O(1 + α)\n");

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 Insert：先查重，再头插 */
int main(void)
{
    HashTable H = CreateTable(11);
    static const ElementType keys[] = { 11, 22, 33, 44, 55 };
    int i;

    printf("按顺序插入: ");
    for (i = 0; i < 5; i++) printf("%d ", keys[i]);
    printf("\n（它们都会散列到 0 号桶）\n\n");

    for (i = 0; i < 5; i++)
    {
        Insert(H, keys[i]);
    }
    PrintTable(H);

    printf("\n[0] 号桶的顺序和插入顺序**相反** —— 因为用的是头插\n\n");

    printf("重复插入 33: ");
    Insert(H, 33);
    {
        Position P;
        int count = 0;
        for (P = H->Heads[0].Next; P != NULL; P = P->Next)
        {
            if (P->Data == 33) count++;
        }
        printf("桶里有 %d 个 33（插入前先查重，所以不会重复）\n", count);
    }

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 Delete：直接从链表摘掉，不需要墓碑 */
int main(void)
{
    HashTable H = CreateTable(11);
    static const ElementType keys[] = { 11, 22, 33, 44, 55 };
    int i;
    Position P;

    for (i = 0; i < 5; i++) Insert(H, keys[i]);

    printf("删除前:\n");
    PrintTable(H);

    printf("\n删除 33: %s\n", Delete(H, 33) == OK ? "成功" : "失败");
    printf("删除 999（不存在）: %s\n\n", Delete(H, 999) == OK ? "成功" : "失败");

    printf("删除后:\n");
    PrintTable(H);

    P = Find(H, 33);
    printf("\n再找 33: %s\n", P ? "还在" : "确实没了");

    printf("\n为什么不需要墓碑？\n");
    printf("  开放地址法的元素靠「数组位置」串成探测链，删中间一个会断链\n");
    printf("  分离链接法的元素靠「链表指针」连接，摘掉一个剩下的还连着\n");
    printf("  （链表删除标准三步：找到前驱 → 绕过 → free）\n");

    DestroyTable(H);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 PrintTable 与 PrintStats */
int main(void)
{
    HashTable H = CreateTable(11);
    static const ElementType bad[] = { 11, 22, 33, 44, 55, 66, 77, 88 };
    static const ElementType good[] = { 1, 2, 3, 4, 5, 6, 7, 8 };
    int i;

    printf("=== 散列函数差的情形（全是 11 的倍数）===\n");
    for (i = 0; i < 8; i++) Insert(H, bad[i]);
    PrintStats(H);
    printf("\n");

    printf("=== 换个表，散列均匀的情形 ===\n");
    {
        HashTable G = CreateTable(11);
        for (i = 0; i < 8; i++) Insert(G, good[i]);
        PrintStats(G);
        printf("\n两种情况的平均长度一样（都是 8/11），但最长链表差很多\n");
        printf("（性能由**最长链表**决定，所以这个统计比平均值更有诊断价值）\n");
        DestroyTable(G);
    }

    printf("\nJava 8 给 HashMap 加了条规则：链表长度超过 8 就转成红黑树\n");
    printf("就是为了把最坏情况从 O(n) 降到 O(log n)\n");

    DestroyTable(H);
    return 0;
}
//%driver-end
