/*
 * ============================================================================
 *  03 树 / 03-01 二叉树基础 —— 练习模式的测试驱动
 * ============================================================================
 *  统一用这棵树：
 *           A
 *         /   \
 *        B     C
 *       / \     \
 *      D   E     F
 *  先序序列：ABD##E##C#F##
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义：一个结点有两个孩子指针 */
int main(void)
{
    TNode n;

    n.data = 'A';
    n.left = NULL;
    n.right = NULL;

    printf("sizeof(TNode) = %d 字节\n", (int)sizeof(TNode));
    printf("sizeof(BinTree) = %d 字节（就是指针大小）\n", (int)sizeof(BinTree));
    printf("结点 %c 的 left 是 %s，right 是 %s\n", n.data,
           n.left == NULL ? "空" : "非空", n.right == NULL ? "空" : "非空");
    printf("（树里 NULL 表示「没有孩子」，是正常状态）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 NewNode：数据填对、两个孩子都是空 */
int main(void)
{
    BinTree t = NewNode('X');

    printf("新结点 data = %c\n", t->data);
    printf("left  %s\n", t->left == NULL ? "是 NULL（对）" : "不是 NULL（错）");
    printf("right %s\n", t->right == NULL ? "是 NULL（对）" : "不是 NULL（错）");
    printf("（少置一个指针就是野指针，遍历时会随机崩溃）\n");

    free(t);
    return 0;
}
//%driver-end

//%driver | 03
/* 验证 CreateTree：按先序序列建出正确的树，再用先序打回来对账 */
int main(void)
{
    const char *s = "ABD##E##C#F##";
    int i = 0;
    BinTree root = CreateTree(s, &i);

    printf("输入序列: %s\n", s);
    printf("读取字符: %d 个\n", i);
    printf("根结点  : %c\n", root->data);
    printf("左孩子  : %c\n", root->left->data);
    printf("右孩子  : %c\n", root->right->data);
    printf("先序打回来: ");
    PreOrder(root);
    printf("\n（应该和输入序列去掉所有 # 之后一致：ABDECF）\n");

    FreeTree(root);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证先序遍历：A B D E C F */
int main(void)
{
    const char *s = "ABD##E##C#F##";
    int i = 0;
    BinTree root = CreateTree(s, &i);

    printf("先序 = ");
    PreOrder(root);
    printf("\n（应该是 A B D E C F —— 根最先）\n");

    FreeTree(root);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证中序遍历：D B E A C F */
int main(void)
{
    const char *s = "ABD##E##C#F##";
    int i = 0;
    BinTree root = CreateTree(s, &i);

    printf("中序 = ");
    InOrder(root);
    printf("\n（应该是 D B E A C F —— 根夹在中间）\n");

    FreeTree(root);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证后序遍历：D E B F C A */
int main(void)
{
    const char *s = "ABD##E##C#F##";
    int i = 0;
    BinTree root = CreateTree(s, &i);

    printf("后序 = ");
    PostOrder(root);
    printf("\n（应该是 D E B F C A —— 根跑到了最后）\n");

    FreeTree(root);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证层序遍历：A B C D E F */
int main(void)
{
    const char *s = "ABD##E##C#F##";
    int i = 0;
    BinTree root = CreateTree(s, &i);

    printf("层序 = ");
    LevelOrder(root);
    printf("\n（应该是 A B C D E F —— 一层一层，横向推进）\n");

    FreeTree(root);
    return 0;
}
//%driver-end

//%driver | 08
/* 验证 FreeTree：后序释放，先孩子后自己 */
int main(void)
{
    const char *s = "ABD##E##C#F##";
    int i = 0;
    BinTree root = CreateTree(s, &i);

    printf("释放前先序: ");
    PreOrder(root);
    printf("\n");

    FreeTree(root);
    printf("整棵树已释放\n");
    printf("（顺序必须是「先孩子后自己」：先 free 根，孩子就再也找不到了）\n");

    return 0;
}
//%driver-end
