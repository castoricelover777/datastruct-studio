/*
 * ============================================================================
 *  LinkList Studio —— 双向链表的"测试驱动"
 * ============================================================================
 *
 *  本文件不参与编译（每个驱动都是独立的 main，无法共存于一个程序），
 *  它只是练习模式脚手架的数据源：
 *
 *     //%driver | 模块编号
 *     ... 一段自包含的 main ...
 *     //%driver-end
 *
 *  打开模块 N 的练习模式时，工具会扫描该驱动用到的函数，
 *  沿调用图把依赖补齐，中间留出模块 N 的空白默写区，驱动附在最后。
 *
 *  双向链表的驱动有个共同点：**凡是会改变链形状的操作，都同时打印正向和反向**。
 *  因为漏改 prior 的 bug 正向完全看不出来，只有反向遍历才会暴露。
 * ============================================================================
 */

//%driver | 01
/* 只验证 typedef 是否可用：能声明变量、能访问两个指针就算过关 */
int main(void)
{
    DuLinkList L = NULL;
    DuLNode node;

    node.data = 42;
    node.prior = NULL;
    node.next = NULL;

    L = &node;

    printf("结构体定义正确：L->data = %d，prior = %s，next = %s\n",
           L->data,
           L->prior == NULL ? "NULL" : "非 NULL",
           L->next == NULL ? "NULL" : "非 NULL");
    printf("sizeof(DuLNode) = %d 字节（比单链表结点多一个指针）\n", (int)sizeof(DuLNode));

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 creatNode：两个指针是不是都干净地置成了 NULL */
int main(void)
{
    DuLNode *p = creatNode(7);

    printf("creatNode 造出的结点：data = %d，prior = %s，next = %s\n",
           p->data,
           p->prior == NULL ? "NULL" : "非 NULL",
           p->next == NULL ? "NULL" : "非 NULL");
    printf("（两个指针都要是 NULL，漏了 prior 后面反向走就会踩野指针）\n");

    free(p);
    printf("结点已释放。\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 InitList：初始化后是空表，而且头结点的 prior 必须是 NULL */
int main(void)
{
    DuLinkList L = NULL;

    if (InitList(&L) != OK)
    {
        printf("初始化失败！\n");
        return ERROR;
    }

    printf("初始化成功，L = %s\n", L != NULL ? "有效头结点" : "NULL");
    printf("头结点的 prior = %s（应为 NULL）\n", L->prior == NULL ? "NULL" : "非 NULL");
    printf("当前链表（正向）：");
    printList(L);
    printf("当前链表（反向）：");
    printListReverse(L);

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 applist：尾插之后正反两个方向都必须是对的 */
int main(void)
{
    DuLinkList L = NULL;
    int i;

    InitList(&L);

    printf("空表正向：");
    printList(L);

    for (i = 1; i <= 3; i++)
    {
        applist(L, i * 10);
    }

    printf("尾插 10 20 30 后（正向）：");
    printList(L);
    printf("尾插 10 20 30 后（反向）：");
    printListReverse(L);
    printf("（反向能打对，说明尾插时 s->prior 那一句没漏）\n");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 HeadInsert：先拿空表开刀 —— 这是双向头插最容易崩的路径 */
int main(void)
{
    DuLinkList L = NULL;

    InitList(&L);

    HeadInsert(L, 5);
    printf("空表头插 5 后（正向）：");
    printList(L);
    printf("空表头插 5 后（反向）：");
    printListReverse(L);
    printf("（空表时 L->next 是 NULL，不判空就去写 s->next->prior 会直接崩）\n");

    HeadInsert(L, 1);
    printf("再头插 1 后（正向）：");
    printList(L);
    printf("再头插 1 后（反向）：");
    printListReverse(L);

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 GetElem_L：正常位、边界位、越界位都要试 */
int main(void)
{
    DuLinkList L = NULL;
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
/* 验证 LocateElem：拿到结点后，前驱和后继都要能说对 */
int main(void)
{
    DuLinkList L = NULL;
    DuLNode *p = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);

    printf("当前链表：");
    printList(L);

    p = LocateElem(L, 20);
    if (p != NULL)
    {
        printf("找到 20：前驱是 %d，后继是 %s\n",
               p->prior->data,
               p->next != NULL ? "一个有效结点" : "NULL");
    }

    p = LocateElem(L, 10);
    if (p != NULL)
    {
        /* 注意：头结点的 data 从来没被赋值（InitList 只管两个指针），
           这里故意**不打印它的值** —— 那个值是 malloc 给的随机内容，
           每次运行都不一样，打出来既不是知识、还会让产物每次都变。 */
        printf("找到 10：它的前驱是头结点（头结点的 data 是未初始化的，读它就是未定义行为）\n");
    }

    p = LocateElem(L, 99);
    printf("查找 99 的结果：%s\n", p == NULL ? "NULL（符合预期）" : "非 NULL（不符合预期）");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 08
/* 验证 ModifyElem：改完值要对，而且链的形状不能变（正反都得一样） */
int main(void)
{
    DuLinkList L = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);

    printf("修改前（正向）：");
    printList(L);

    if (ModifyElem(L, 2, 99) == OK)
    {
        printf("把第 2 个元素改成 99 后（正向）：");
        printList(L);
        printf("把第 2 个元素改成 99 后（反向）：");
        printListReverse(L);
    }
    printf("（改值只动 data，指针一根都不该变）\n");

    if (ModifyElem(L, 9, 1) == ERROR) printf("改第 9 个元素：越界，返回 ERROR（符合预期）\n");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 09
/* 验证 ListInsert：中间插、头部插、尾部插（判空分支）、越界插 */
int main(void)
{
    DuLinkList L = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);

    printf("插入前（正向）：");
    printList(L);

    ListInsert(L, 2, 15);
    printf("在第 2 位插入 15（正向）：");
    printList(L);
    printf("在第 2 位插入 15（反向）：");
    printListReverse(L);

    ListInsert(L, 1, 5);
    printf("在第 1 位插入 5 （正向）：");
    printList(L);

    ListInsert(L, 5, 99);
    printf("插到表尾（第 5 位）后（正向）：");
    printList(L);
    printf("插到表尾（第 5 位）后（反向）：");
    printListReverse(L);
    printf("（插到表尾时 p->next 是 NULL，不判空就会崩在这里）\n");

    printf("在第 99 位插入：%s\n", ListInsert(L, 99, 1) == OK ? "成功（不符合预期）" : "失败（越界，符合预期）");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 10
/* 验证 ListDelete：删中间、删第一个、删尾结点（判空分支）、越界删 */
int main(void)
{
    DuLinkList L = NULL;
    ElemType e = -1;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);
    applist(L, 30);
    applist(L, 40);

    printf("删除前（正向）：");
    printList(L);

    if (ListDelete(L, 2, &e) == OK) printf("删除第 2 个结点，值是 %d\n", e);
    printf("删除后（正向）：");
    printList(L);
    printf("删除后（反向）：");
    printListReverse(L);

    if (ListDelete(L, 1, &e) == OK) printf("删除第 1 个结点，值是 %d\n", e);
    printf("再删除后（正向）：");
    printList(L);

    if (ListDelete(L, 2, &e) == OK) printf("删除最后一个结点，值是 %d\n", e);
    printf("删掉尾结点后（正向）：");
    printList(L);
    printf("删掉尾结点后（反向）：");
    printListReverse(L);
    printf("（删尾结点时 p->next 是 NULL，那一条判空分支必须测到）\n");

    printf("删除第 9 个结点：%s\n", ListDelete(L, 9, &e) == OK ? "成功（不符合预期）" : "失败（越界，符合预期）");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 11
/* 验证 printList：空表要有明确提示，非空要能完整走完 */
int main(void)
{
    DuLinkList L = NULL;

    InitList(&L);

    printf("空表输出：");
    printList(L);

    applist(L, 10);
    applist(L, 20);
    applist(L, 30);
    printf("三元素输出：");
    printList(L);

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 12
/* 验证 printListReverse：这是双向链表独有的能力，也是最容易写错的地方 */
int main(void)
{
    DuLinkList L = NULL;

    InitList(&L);

    printf("空表反向输出：");
    printListReverse(L);

    applist(L, 10);
    applist(L, 20);
    applist(L, 30);
    printf("正向输出：");
    printList(L);
    printf("反向输出：");
    printListReverse(L);
    printf("（反向输出必须是正向的倒序，而且是 30 20 10，不能多打一个头结点）\n");

    freeList(&L);
    return 0;
}
//%driver-end

//%driver | 13
/* 验证 freeList：释放完 L 必须变成 NULL，否则是野指针 */
int main(void)
{
    DuLinkList L = NULL;

    InitList(&L);
    applist(L, 10);
    applist(L, 20);

    printf("释放前 L = %s\n", L != NULL ? "非 NULL" : "NULL");
    freeList(&L);
    printf("释放后 L = %s\n", L == NULL ? "NULL（符合预期）" : "非 NULL（不符合预期）");
    printf("（双向链表释放只需要走 next 方向，prior 用不上）\n");

    return 0;
}
//%driver-end
