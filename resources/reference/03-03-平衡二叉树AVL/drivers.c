/*
 * ============================================================================
 *  03 树 / 03-03 平衡二叉树 AVL —— 练习模式的测试驱动
 * ============================================================================
 *  目录名里带小写 avl 是为了区分模块编号，实际内容就是 AVL 树。
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义：结点比普通二叉树多一个 height */
int main(void)
{
    AVLNode n;

    n.data = 5;
    n.left = NULL;
    n.right = NULL;
    n.height = 1;

    printf("sizeof(AVLNode) = %d 字节（比普通二叉树结点多一个 int）\n", (int)sizeof(AVLNode));
    printf("多出来的 height 用来 O(1) 算平衡因子\n");
    printf("约定：空树高度 0，叶子高度 1\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 GetHeight：空树是 0，叶子是 1，往上逐层加一 */
int main(void)
{
    /* 手工搭一棵小树，不调用 AVLInsert ——
       它反过来依赖本模块的函数，用了会造成"用者在前、被用者在后" */
    AVLNode leafL, leafR, root;

    leafL.data = 3; leafL.left = NULL; leafL.right = NULL; leafL.height = 1;
    leafR.data = 8; leafR.left = NULL; leafR.right = NULL; leafR.height = 1;
    root.data = 5;  root.left = &leafL; root.right = &leafR; root.height = 2;

    printf("空树高度   = %d（约定空树是 0，不是 -1）\n", GetHeight(NULL));
    printf("叶子高度   = %d\n", GetHeight(&leafL));
    printf("两层的树   = %d\n", GetHeight(&root));
    printf("（约定空树为 0，叶子的高度就自然算成 1，式子里不用到处特判）\n");

    return 0;
}


//%driver-end

//%driver | 03
/* 验证 RotateLL（右单旋）：5 3 1 */
int main(void)
{
    /* 手工搭出 5 -> 3 -> 1 这条左斜链，避开 AVLInsert 的自动平衡 */
    AVLTree a = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree b = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree c = (AVLTree)malloc(sizeof(AVLNode));

    c->data = 1; c->left = c->right = NULL; c->height = 1;
    b->data = 3; b->left = c; b->right = NULL; b->height = 2;
    a->data = 5; a->left = b; a->right = NULL; a->height = 3;

    printf("旋转前：根 %d，高 %d，平衡因子 %d\n", a->data, a->height, BalanceFactor(a));
    printf("  中序: "); InOrder(a); printf("\n");

    a = RotateLL(a);

    printf("旋转后：根 %d，高 %d，平衡因子 %d\n", a->data, a->height, BalanceFactor(a));
    printf("  中序: "); InOrder(a); printf("\n");
    printf("（中序必须不变：1 3 5 —— 旋转只换父子关系，不换左右顺序）\n");

    FreeTree(a);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 RotateRR（左单旋）：3 5 7 */
int main(void)
{
    AVLTree a = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree b = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree c = (AVLTree)malloc(sizeof(AVLNode));

    c->data = 7; c->left = c->right = NULL; c->height = 1;
    b->data = 5; b->left = NULL; b->right = c; b->height = 2;
    a->data = 3; a->left = NULL; a->right = b; a->height = 3;

    printf("旋转前：根 %d，高 %d，平衡因子 %d\n", a->data, a->height, BalanceFactor(a));
    a = RotateRR(a);
    printf("旋转后：根 %d，高 %d，平衡因子 %d\n", a->data, a->height, BalanceFactor(a));
    printf("  中序: "); InOrder(a); printf("\n");
    printf("（名字的坑：RR 用的是「左单旋」，方向和名字是反的）\n");

    FreeTree(a);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 RotateLR（左右双旋）：5 3 4 */
int main(void)
{
    AVLTree a = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree b = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree c = (AVLTree)malloc(sizeof(AVLNode));

    c->data = 4; c->left = c->right = NULL; c->height = 1;
    b->data = 3; b->left = NULL; b->right = c; b->height = 2;
    a->data = 5; a->left = b; a->right = NULL; a->height = 3;

    printf("旋转前：根 %d，平衡因子 %d\n", a->data, BalanceFactor(a));
    printf("  中序: "); InOrder(a); printf("\n");

    a = RotateLR(a);

    printf("旋转后：根 %d，平衡因子 %d\n", a->data, BalanceFactor(a));
    printf("  中序: "); InOrder(a); printf("\n");
    printf("（先对左孩子左旋掰成 LL，再对自己右单旋）\n");

    FreeTree(a);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 RotateRL（右左双旋）：3 5 4 */
int main(void)
{
    AVLTree a = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree b = (AVLTree)malloc(sizeof(AVLNode));
    AVLTree c = (AVLTree)malloc(sizeof(AVLNode));

    c->data = 4; c->left = c->right = NULL; c->height = 1;
    b->data = 5; b->left = c; b->right = NULL; b->height = 2;
    a->data = 3; a->left = NULL; a->right = b; a->height = 3;

    printf("旋转前：根 %d，平衡因子 %d\n", a->data, BalanceFactor(a));
    a = RotateRL(a);
    printf("旋转后：根 %d，平衡因子 %d\n", a->data, BalanceFactor(a));
    printf("  中序: "); InOrder(a); printf("\n");
    printf("（是 LR 的镜像：先对右孩子右旋掰成 RR，再对自己左单旋）\n");

    FreeTree(a);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证 AVLInsert：有序插入也不会退化 */
int main(void)
{
    AVLTree T = NULL;
    int i;

    for (i = 1; i <= 7; i++)
    {
        T = AVLInsert(T, i);
        printf("插入 %d → 根 %d，高 %d\n", i, T->data, T->height);
    }

    printf("\n中序: "); InOrder(T); printf("\n");
    printf("树高 %d（7 个结点的平衡树应该是 3）\n", T->height);
    printf("（普通 BST 按 1..7 插会得到高度 7 的链）\n");

    FreeTree(T);
    return 0;
}
//%driver-end

//%driver | 08
/* 验证 InOrder：排序性质没被破坏 */
int main(void)
{
    static const int ins[] = { 50, 20, 70, 10, 30, 60, 80, 5 };
    AVLTree T = NULL;
    int i;

    for (i = 0; i < 8; i++)
    {
        T = AVLInsert(T, ins[i]);
    }

    printf("插入 8 个值后中序: ");
    InOrder(T);
    printf("\n（必须递增 —— 旋转没有改变中序）\n");
    printf("树高 = %d，平衡因子 = %d\n", T->height, BalanceFactor(T));

    FreeTree(T);
    return 0;
}
//%driver-end

//%driver | 09
/* 验证 FreeTree：后序释放 */
int main(void)
{
    AVLTree T = NULL;
    int i;

    for (i = 1; i <= 5; i++) T = AVLInsert(T, i);

    printf("释放前中序: ");
    InOrder(T);
    printf("\n树高 = %d\n", T->height);

    FreeTree(T);
    printf("整棵树已释放（后序：先孩子后自己）\n");

    return 0;
}
//%driver-end

//%driver | 10
/* 验证 CheckBalance：AVL 的每个结点都应该平衡 */
int main(void)
{
    AVLTree T = NULL;
    int i;

    printf("按有序序列 1..8 插入（普通 BST 会退化成链）：\n");
    for (i = 1; i <= 8; i++) T = AVLInsert(T, i);

    printf("  中序: "); InOrder(T); printf("\n");
    printf("  树高 = %d（8 个结点的平衡树应该是 4）\n", T->height);
    printf("  逐结点检查平衡因子：");
    if (CheckBalance(T)) printf("全部在 -1..1 之间，合格\n");

    FreeTree(T);
    return 0;
}
//%driver-end
