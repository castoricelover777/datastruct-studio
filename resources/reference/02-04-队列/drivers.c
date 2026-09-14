/*
 * ============================================================================
 *  02 线性结构 / 02-04 队列 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义与两个指针的约定 */
int main(void)
{
    Queue Q;

    Q.front = 0;                /* 这个模块只讲"长什么样" */
    Q.rear = 0;

    printf("MAXSIZE = %d\n", MAXSIZE);
    printf("sizeof(Queue) = %d 字节\n", (int)sizeof(Queue));
    printf("空队：front == rear（当前都是 %d）\n", Q.front);
    printf("实际能装 %d 个 —— 故意留一格用来区分空和满\n", MAXSIZE - 1);

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 InitQueue：两个指针都要归零 */
int main(void)
{
    Queue Q;

    Q.front = 7;
    Q.rear = 9;
    InitQueue(&Q);
    printf("初始化后 front = %d, rear = %d\n", Q.front, Q.rear);
    printf("（两者相等即队空）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 EnQueue：rear 会绕环前进，满了要拒绝 */
int main(void)
{
    Queue Q;
    int i;
    int n = 0;

    InitQueue(&Q);
    EnQueue(&Q, 10);
    printf("入队 1 个后 front = %d, rear = %d\n", Q.front, Q.rear);

    /* 一直入队到满，看能装几个、rear 怎么绕 */
    while (EnQueue(&Q, n + 100) == OK)
    {
        n++;
    }
    printf("一共装下 %d 个（MAXSIZE-1 = %d）\n", n, MAXSIZE - 1);
    printf("装满时 front = %d, rear = %d\n", Q.front, Q.rear);
    printf("满队再入 -> %s\n", EnQueue(&Q, 1) == ERROR ? "被拒绝" : "竟然成功了");

    /* 出队两个再入队，观察 rear 绕回小下标 */
    for (i = 0; i < 2; i++)
    {
        ElemType e;
        DeQueue(&Q, &e);
    }
    printf("出队 2 个后 front = %d\n", Q.front);
    EnQueue(&Q, 777);
    printf("再入队 1 个后 rear = %d（绕回小下标就是环生效了）\n", Q.rear);

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 DeQueue：先进先出、空队要拒绝 */
int main(void)
{
    Queue Q;
    ElemType e;
    int i;

    InitQueue(&Q);
    for (i = 1; i <= 4; i++)
    {
        EnQueue(&Q, i * 10);
    }

    printf("出队顺序（应该是 10 20 30 40）: ");
    while (DeQueue(&Q, &e) == OK)
    {
        printf("%d ", e);
    }
    printf("\n");

    printf("出空后 front = %d, rear = %d\n", Q.front, Q.rear);
    printf("空队再出 -> %s\n", DeQueue(&Q, &e) == ERROR ? "被拒绝" : "竟然成功了");

    return 0;
}
//%driver-end
