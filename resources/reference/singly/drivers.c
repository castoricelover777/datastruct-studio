/*
 * ============================================================================
 *  LinkList Studio —— 练习模式的"测试驱动"
 * ============================================================================
 *
 *  本文件不参与编译（每个驱动都是独立的 main 函数，无法共存于一个程序），
 *  它只是脚手架的数据源：
 *
 *     //%driver | 模块编号
 *     ... 一段自包含的 main ...
 *     //%driver-end
 *
 *  当用户打开模块 N 的练习模式时，工具会：
 *     1. 扫描该驱动里用到的参考函数；
 *     2. 沿调用图把它们的依赖也补齐（例如 applist 会带出 creatNode）；
 *     3. 把这些"已给出"的模块代码放在前面；
 *     4. 中间留出模块 N 的空白默写区；
 *     5. 把驱动附在最后。
 *  这样填完空就能直接 Ctrl + Enter 看到运行结果，形成完整闭环。
 * ============================================================================
 */

//%driver | 01
/* 只验证 typedef 是否可用：能声明变量、能访问成员就算过关 */
int main(void)
{
    LinkList L = NULL;
    LNode node;

    node.data = 42;
    node.next = NULL;

    L = &node;

    printf("结构体定义正确：L->data = %d，L->next = %s\n",
           L->data, L->next == NULL ? "NULL" : "非 NULL");
    printf("sizeof(LNode) = %d 字节\n", (int)sizeof(LNode));

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 creatNode：数据填对了没有？next 是不是干净的 NULL？ */
int main(void)
{
    LNode *p = creatNode(7);

    printf("creatNode 造出的结点：data = %d，next = %s\n",
           p->data, p->next == NULL ? "NULL" : "非 NULL");

    free(p);
    printf("结点已释放。\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 InitList：初始化后应该是"空表"，而且 L 不能是野指针 */
int main(void)
{
    LinkList L = NULL;

    if (InitList(&L) != OK)
    {
        printf("初始化失败！\n");
        return ERROR;
    }

    printf("初始化成功，L = %s\n", L != NULL ? "有效头结点" : "NULL");
    printf("当前链表：");
    printList(L);

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 applist：连续追加后顺序是否保持，空表追加有没有问题 */
int main(void)
{
    LinkList L = NULL;
    int i;

    InitList(&L);

    printf("空表追加前：");
    printList(L);

    for (i = 1; i <= 3; i++)
    {
        applist(L, i * 10);
    }

    printf("追加 10 20 30 后：");
    printList(L);

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 HeadInsert：头插会颠倒顺序，而且插完链表必须仍然完整可遍历 */
int main(void)
{
    LinkList L = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);
    printf("尾插 10 20 30 后：");
    printList(L);

    HeadInsert(L, 5);
    printf("头插 5 之后：     ");
    printList(L);

    HeadInsert(L, 1);
    printf("再头插 1 之后：   ");
    printList(L);
    printf("（头插法建的链表天生逆序，「头插法建表」就是靠这个特性做倒序的）\n");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 GetElem_L：正常位、边界位、越界位都要试 */
int main(void)
{
    LinkList L = NULL;
    ElemType e = -1;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);

    printf("当前链表：");
    printList(L);

    if (GetElem_L(L, 1, &e) == OK) printf("第 1 个元素 = %d\n", e);
    if (GetElem_L(L, 3, &e) == OK) printf("第 3 个元素 = %d\n", e);
    if (GetElem_L(L, 4, &e) == ERROR) printf("第 4 个元素：越界，返回 ERROR（符合预期）\n");
    if (GetElem_L(L, 0, &e) == ERROR) printf("第 0 个元素：非法位置，返回 ERROR（符合预期）\n");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证 LocateElem：找到了要能顺着 next 继续走，找不到必须给 NULL */
int main(void)
{
    LinkList L = NULL;
    LNode *p = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);

    printf("当前链表：");
    printList(L);

    p = LocateElem(L, 20);
    if (p != NULL) printf("找到 20，它的后继是 %s\n", p->next != NULL ? "有效结点" : "NULL");

    p = LocateElem(L, 10);
    if (p != NULL) printf("找到 10，它就是第 1 个结点\n");

    p = LocateElem(L, 99);
    printf("查找 99 的结果：%s\n", p == NULL ? "NULL（符合预期）" : "非 NULL（不符合预期）");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 08
/* 验证 ListInsert：中间插入、头部插入、越界插入三种情况 */
int main(void)
{
    LinkList L = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);

    printf("插入前：");
    printList(L);

    ListInsert(L, 2, 15);
    printf("在第 2 位插入 15：");
    printList(L);

    ListInsert(L, 1, 5);
    printf("在第 1 位插入 5 ：");
    printList(L);

    printf("在第 99 位插入：%s\n", ListInsert(L, 99, 1) == OK ? "成功（不符合预期）" : "失败（越界，符合预期）");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 09
/* 验证 ListDelete：删中间、删第一个、越界删除 */
int main(void)
{
    LinkList L = NULL;
    ElemType e = -1;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);

    printf("删除前：");
    printList(L);

    if (ListDelete(L, 2, &e) == OK) printf("删除第 2 个结点，值是 %d\n", e);
    printf("删除后：");
    printList(L);

    if (ListDelete(L, 1, &e) == OK) printf("删除第 1 个结点，值是 %d\n", e);
    printf("再删除后：");
    printList(L);

    printf("删除第 9 个结点：%s\n", ListDelete(L, 9, &e) == OK ? "成功（不符合预期）" : "失败（越界，符合预期）");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 10
/* 验证 printList：空表要有明确提示，非空要能完整走完 */
int main(void)
{
    LinkList L = NULL;

    InitList(&L);

    printf("空表输出：");
    printList(L);

    applist(L, 10);
    applist(L, 15);
    applist(L, 20);
    printf("三元素输出：");
    printList(L);

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 11
/* 验证 freeList：释放完 L 必须变成 NULL，否则是野指针 */
int main(void)
{
    LinkList L = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);

    printf("释放前 L = %s\n", L != NULL ? "非 NULL" : "NULL");
    freeList(&L);
    printf("释放后 L = %s\n", L == NULL ? "NULL（符合预期）" : "非 NULL（不符合预期）");

    return 0;
}
//%driver-end
