/*
 * ============================================================================
 *  07 我已学习的高级算法 / 07-01 KMP 字符串匹配 —— 练习模式的测试驱动
 * ============================================================================
 *
 *  每个 //%driver | NN 对应 //%module | NN：
 *  只留目标模块的空壳时，这个驱动必须仍然能编译、运行、给出可对照的输出。
 */

//%driver | 01
/* 验证类型与约定（只用本模块的东西：类型、宏、样例模式串） */
int main(void)
{
    const char *P = KMP_DEMO_PATTERN;
    MatchTable match = KMP_DEMO_MATCH;
    int j;

    printf("模式串 P = \"%s\"（长度 %d）\n", P, (int)strlen(P));
    printf("类型 MatchTable 的大小 = %d 个 int\n\n", (int)(sizeof(MatchTable) / sizeof(int)));

    printf("按 match 的定义逐个看 P 的每个前缀：\n");
    for (j = 0; j < KMP_DEMO_LEN; j++)
    {
        printf("  P[0..%d] = %.*s  →  match[%d] = %d\n",
               j, j + 1, P, j, match[j]);
    }

    printf("\n怎么读这张表：\n");
    printf("  match[3] = 2 表示 \"abab\" 的最长相等前后缀是 \"ab\"（长度 2）\n");
    printf("  match[0] = 0 是递推起点：长度为 1 的串没有真前后缀\n");
    printf("  整张表只取决于 P，和主串 S 无关\n");
    printf("  找不到时统一返回 KMP_NOTFOUND（= %d）\n", KMP_NOTFOUND);

    return 0;
}
//%driver-end

//%driver | 02
/* 验证暴力匹配：先在一个正常场景里找对位置，再看找不到的情况 */
int main(void)
{
    const char *tests[3][2] = {
        { "abababab", "abab" },
        { "xxababacxx", "ababac" },
        { "abcdef", "xyz" },
    };
    int t;

    for (t = 0; t < 3; t++)
    {
        int at = NaiveMatch(tests[t][0], tests[t][1]);
        printf("S = \"%s\"，P = \"%s\"\n", tests[t][0], tests[t][1]);
        if (at >= 0)
        {
            printf("  第一次出现在下标 %d\n", at);
            printf("  核对：从该位置起是 \"%.*s\"\n",
                   (int)strlen(tests[t][1]), tests[t][0] + at);
        }
        else
        {
            printf("  没找到（返回 -1）——  " );
            printf("主串里不含这个模式串\n");
        }
        printf("\n");
    }

    printf("注意：暴力匹配每次失败都会把主串指针退回去重比，\n");
    printf("所以 S=\"aaaaaaaaab\"、P=\"aaab\" 这种输入会退化成 O(n*m)\n");

    return 0;
}
//%driver-end

//%driver | 03
/* 验证 ShowMatchCalc：按定义硬算出来的值，必须和手算的 match 表逐位一致 */
int main(void)
{
    const char *P = "ababac";
    const int expect[6] = { 0, 0, 1, 2, 3, 0 };
    int j;
    int ok = 1;

    printf("P = \"%s\"\n", P);
    printf("按定义逐位硬算（不查表）：\n");

    for (j = 0; j < 6; j++)
    {
        int v = ShowMatchCalc(P, j);
        if (v != expect[j]) ok = 0;
        printf("  P[0..%d] = %-6.*s  最长相等前后缀长度 = %d", j, j + 1, P, v);
        if (v > 0)
        {
            printf("   （前缀和后缀都是 \"%.*s\"）", v, P);
        }
        printf("\n");
    }

    printf("\n全部与手算一致：%s\n", ok ? "是" : "否");
    printf("注意 j=5 这一位：\"ababac\" 前后缀一个都对不上，所以是 0\n");
    printf("定义搞清楚了，04 的递推就只是\"把它算快一点\"\n");

    return 0;
}
//%driver-end

//%driver | 04
/* 验证 buildMatch：对照手算的表，并用一个典型的"回退"例子考它 */
int main(void)
{
    const char *cases[3] = { "ababac", "aaaa", "abababab" };
    const int expect[3][8] = {
        { 0, 0, 1, 2, 3, 0 },
        { 0, 1, 2, 3 },
        { 0, 0, 1, 2, 3, 4, 5, 6 },
    };
    int match[64];
    int c;

    for (c = 0; c < 3; c++)
    {
        const char *P = cases[c];
        int m = (int)strlen(P);
        int j;
        int ok = 1;

        buildMatch(P, match);

        printf("P = \"%s\"\n", P);
        printf("  算出来：");
        for (j = 0; j < m; j++)
        {
            printf(" %d", match[j]);
            if (match[j] != expect[c][j]) ok = 0;
        }
        printf("\n  手算的：");
        for (j = 0; j < m; j++)
        {
            printf(" %d", expect[c][j]);
        }
        printf("\n  一致：%s\n\n", ok ? "是" : "否");
    }

    printf("第二个例子 P=\"aaaa\" 是关键：match 一路涨到 3，\n");
    printf("说明\"重叠的前后缀\"是允许的 —— 这也是 KMP 能处理 aaaa 这种串的原因\n");

    return 0;
}
//%driver-end

//%driver | 05
/* 验证 KMPMatch：正常命中、找不到、以及必须靠 match 表才能做对的重叠场景 */
int main(void)
{
    const char *S[4] = { "abababab", "xxababacxx", "abcdef", "aaaaab" };
    const char *P[4] = { "abab", "ababac", "xyz", "aaab" };
    int match[64];
    int t;

    for (t = 0; t < 4; t++)
    {
        buildMatch(P[t], match);
        printf("S = \"%s\"，P = \"%s\"，match 表 = {", S[t], P[t]);
        {
            int j;
            for (j = 0; j < (int)strlen(P[t]); j++)
            {
                printf("%s%d", j ? ", " : "", match[j]);
            }
        }
        printf("}\n");
        printf("  KMPMatch → %d\n\n", KMPMatch(S[t], P[t], match));
    }

    printf("第 4 个场景 S=\"aaaaab\"、P=\"aaab\" 是暴力匹配的痛点：\n");
    printf("每失败一次都要退回去重比，而 KMP 靠 match 表只退模式串、主串一路向前\n");

    return 0;
}
//%driver-end

/*
 * 说明：main 模块（06）没有驱动。
 *
 * 这不是漏写 —— 惯例是「有驱动的模块到 main 前一个为止」：
 * main 本身就是"把整个算法跑一遍"的入口，它的预期输出由 build-data.js
 * 直接运行 main 得到。再给 main 配一个也叫 main 的驱动，链接时必然
 * redefinition of 'main'。（06-01 的 main 是模块 07，驱动同样只到 06。）
 *
 * 同理，模块 03 是纯讲解模块（只有 match 表的定义和例子，没有函数），
 * 也没有驱动 —— 它的内容在 04 的动画里带着看。
 */
