/*
 * ============================================================================
 *  02 线性结构 / 02-05 应用实例 —— 练习模式的测试驱动
 * ============================================================================
 */

//%driver | 01
/* 验证优先级表 */
int main(void)
{
    const char *ops = "+-*/()";
    int i;

    printf("运算符优先级：\n");
    for (i = 0; ops[i] != '\0'; i++)
    {
        printf("  '%c' -> %d\n", ops[i], priority(ops[i]));
    }
    printf("  '9' -> %d（不是运算符）\n", priority('9'));
    printf("（左括号在栈内优先级最低，保证它不会提前被弹出去）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证中缀转后缀：优先级、括号、同级顺序 */
int main(void)
{
    char buf[64];

    InfixToPostfix("3+4*2", buf);
    printf("3+4*2     -> %s\n", buf);

    InfixToPostfix("3*4+2", buf);
    printf("3*4+2     -> %s\n", buf);

    InfixToPostfix("3+4-2", buf);
    printf("3+4-2     -> %s\n", buf);

    InfixToPostfix("3*(4+2)", buf);
    printf("3*(4+2)   -> %s\n", buf);

    InfixToPostfix("(1+2)*(3+4)", buf);
    printf("(1+2)*(3+4) -> %s\n", buf);

    printf("（括号在后缀式里消失了，但顺序没有丢）\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证后缀求值：包括最容易写错的减法顺序 */
int main(void)
{
    int ok;
    int v;

    v = EvalPostfix("34+", &ok);
    printf("34+  = %d (ok=%d)\n", v, ok);

    v = EvalPostfix("34*", &ok);
    printf("34*  = %d (ok=%d)\n", v, ok);

    v = EvalPostfix("73-", &ok);
    printf("73-  = %d (ok=%d) —— 应该是 4，写成 -4 就是左右操作数搞反了\n", v, ok);

    v = EvalPostfix("82/", &ok);
    printf("82/  = %d (ok=%d)\n", v, ok);

    v = EvalPostfix("342*+", &ok);
    printf("342*+ = %d (ok=%d)\n", v, ok);

    v = EvalPostfix("3+", &ok);
    printf("3+   = %d (ok=%d) —— 操作数不够，应该 ok=0\n", v, ok);

    v = EvalPostfix("30/", &ok);
    printf("30/  = %d (ok=%d) —— 除数为 0，应该 ok=0\n", v, ok);

    return 0;
}
//%driver-end
