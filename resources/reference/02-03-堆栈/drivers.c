/*
 * ============================================================================
 *  02 线性结构 / 02-03 堆栈 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义：空栈约定 */
int main(void)
{
    Stack S;

    S.top = -1;                 /* 这个模块只讲"长什么样"，不调用 InitStack */

    printf("MAXSIZE = %d\n", MAXSIZE);
    printf("sizeof(Stack) = %d 字节\n", (int)sizeof(Stack));
    printf("空栈 top = %d（约定：top 指向栈顶元素，-1 表示空）\n", S.top);
    printf("装满时 top 应该是 %d\n", MAXSIZE - 1);

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 InitStack：无论之前 top 是多少，都要变回 -1 */
int main(void)
{
    Stack S;

    S.top = 77;                 /* 先弄脏 */
    InitStack(&S);
    printf("初始化后 top = %d\n", S.top);
    printf("（空栈的唯一标志就是 top == -1）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 Push：top 递增、元素就位、满了要拒绝 */
int main(void)
{
    Stack S;
    int i;

    InitStack(&S);
    Push(&S, 10);
    printf("压入 10 后 top = %d, data[0] = %d\n", S.top, S.data[0]);

    Push(&S, 20);
    Push(&S, 30);
    printf("再压 20 30 后 top = %d\n", S.top);
    printf("栈内容: ");
    for (i = 0; i <= S.top; i++)
    {
        printf("%d ", S.data[i]);
    }
    printf("\n");

    /* 压满 */
    for (i = S.top + 1; i < MAXSIZE; i++)
    {
        Push(&S, i);
    }
    printf("压满后 top = %d（应该是 %d）\n", S.top, MAXSIZE - 1);
    printf("满栈再压 -> %s\n", Push(&S, 999) == ERROR ? "被拒绝" : "竟然成功了");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 Pop：后进先出、空栈要拒绝 */
int main(void)
{
    Stack S;
    ElemType e;
    int i;

    InitStack(&S);
    for (i = 1; i <= 3; i++)
    {
        Push(&S, i * 10);
    }

    printf("弹出顺序（应该是 30 20 10）: ");
    while (Pop(&S, &e) == OK)
    {
        printf("%d ", e);
    }
    printf("\n");

    printf("弹空后 top = %d\n", S.top);
    printf("空栈再弹 -> %s\n", Pop(&S, &e) == ERROR ? "被拒绝" : "竟然成功了");

    return 0;
}
//%driver-end
