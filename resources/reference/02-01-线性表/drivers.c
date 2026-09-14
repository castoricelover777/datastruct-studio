/*
 * ============================================================================
 *  02 线性结构 / 02-01 线性表 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义：能装的格子上限是 MAXSIZE，实际有几个看 length */
int main(void)
{
    SeqList L;

    /* 这个模块只讲"结构长什么样"，所以不调用 InitList_Sq ——
       那是模块 02 的事，这里直接给 length 赋值就够了，
       也免得脚手架里出现"用了后面的模块"这种反向依赖 */
    L.length = 0;

    printf("MAXSIZE = %d\n", MAXSIZE);
    printf("sizeof(SeqList) = %d 字节\n", (int)sizeof(SeqList));
    printf("length = %d\n", L.length);
    printf("（关键：MAXSIZE 是能装多少，length 是实际有几个）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 InitList_Sq：初始化后 length 必须是 0 */
int main(void)
{
    SeqList L;

    L.length = 999;                 /* 先故意弄脏 */
    InitList_Sq(&L);
    printf("初始化后 length = %d\n", L.length);
    printf("（关键：初始化不是清空数组，而是把 length 归零）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 ListInsert_Sq：插入后 length 加一，且顺序正确 */
int main(void)
{
    SeqList L;
    int i;

    InitList_Sq(&L);
    for (i = 1; i <= 5; i++)
    {
        ListInsert_Sq(&L, i, i * 10);
    }
    printf("尾部追加 5 个后 length = %d\n", L.length);

    /* 在下标 2（位序 3）插入 25，观察后移 */
    ListInsert_Sq(&L, 3, 25);
    printf("在位序 3 插入 25 后 length = %d\n", L.length);
    printf("数据: ");
    for (i = 0; i < L.length; i++)
    {
        printf("%d ", L.data[i]);
    }
    printf("\n");

    /* 越界与满表 */
    printf("在位序 0 插入 -> %s\n", ListInsert_Sq(&L, 0, 1) == ERROR ? "被拒绝" : "竟然成功了");
    printf("在位序 %d 插入 -> %s\n", L.length + 2, ListInsert_Sq(&L, L.length + 2, 1) == ERROR ? "被拒绝" : "竟然成功了");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 ListDelete_Sq：删除后 length 减一，被删元素通过指针带回 */
int main(void)
{
    SeqList L;
    ElemType e;
    int i;

    InitList_Sq(&L);
    for (i = 1; i <= 5; i++)
    {
        ListInsert_Sq(&L, i, i * 10);
    }
    printf("删除前 length = %d\n", L.length);

    ListDelete_Sq(&L, 1, &e);
    printf("删除位序 1 -> 拿到 %d\n", e);
    ListDelete_Sq(&L, L.length, &e);
    printf("删除最后一个 -> 拿到 %d\n", e);
    printf("删除后 length = %d\n", L.length);
    printf("数据: ");
    for (i = 0; i < L.length; i++)
    {
        printf("%d ", L.data[i]);
    }
    printf("\n");

    printf("删空表 -> %s\n", ListDelete_Sq(&L, 1, &e) == ERROR ? "被拒绝" : "竟然成功了");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 LocateElem_Sq：找到返回位序，找不到返回 0 */
int main(void)
{
    SeqList L;
    int r;
    int i;

    InitList_Sq(&L);
    for (i = 1; i <= 5; i++)
    {
        ListInsert_Sq(&L, i, i * 10);
    }

    r = LocateElem_Sq(L, 30);
    printf("找 30 -> 位序 %d\n", r);
    r = LocateElem_Sq(L, 10);
    printf("找 10 -> 位序 %d\n", r);
    r = LocateElem_Sq(L, 50);
    printf("找 50 -> 位序 %d\n", r);
    r = LocateElem_Sq(L, 99);
    printf("找 99 -> 位序 %d（0 表示没找到）\n", r);

    return 0;
}
//%driver-end
