/*
 * ============================================================================
 *  03 树 / 03-02 二叉搜索树 —— 练习模式的测试驱动
 * ============================================================================
 *  插入序列：8 3 10 1 6 14 4 7 13
 *  建出来的树：
 *          8
 *        /   \
 *       3     10
 *      / \      \
 *     1   6      14
 *        / \    /
 *       4   7  13
 *  中序：1 3 4 6 7 8 10 13 14
 * ============================================================================
 */

//%driver | 01
/* 验证结构定义：和普通二叉树一样，差别在"怎么用" */
int main(void)
{
    TNode n;

    n.data = 5;
    n.left = NULL;
    n.right = NULL;

    printf("sizeof(TNode) = %d 字节\n", (int)sizeof(TNode));
    printf("结点结构：data + left + right —— 和普通二叉树完全一样\n");
    printf("差别不在结构，而在约束：左子树所有值 < 根 < 右子树所有值\n");
    printf("（同一种结构加不同约束，就是不同的数据结构）\n");

    return 0;
}
//%driver-end

//%driver | 02
/* 验证 NewNode：新结点是叶子 */
int main(void)
{
    BinTree t = NewNode(42);

    printf("新结点 data = %d\n", t->data);
    printf("left  %s，right %s\n",
           t->left == NULL ? "空" : "非空", t->right == NULL ? "空" : "非空");
    printf("（BST 插入时新结点一定是叶子 —— 从不改动已有结点的关系）\n");

    free(t);
    return 0;
}
//%driver-end

//%driver | 03
/* 验证 BSTFind：命中的路径、未命中的返回 NULL、递归与循环两版一致 */
int main(void)
{
    static const int ins[] = { 8, 3, 10, 1, 6, 14, 4, 7, 13 };
    BinTree T = NULL;
    int i;

    for (i = 0; i < 9; i++)
    {
        T = BSTInsert(T, ins[i]);
    }

    printf("查 7  → %s\n", BSTFind(T, 7) ? "找到" : "没找到");
    printf("查 1  → %s\n", BSTFind(T, 1) ? "找到" : "没找到");
    printf("查 13 → %s\n", BSTFind(T, 13) ? "找到" : "没找到");
    printf("查 99 → %s\n", BSTFind(T, 99) ? "找到" : "没找到（不在树里）");
    printf("查 5  → %s\n", BSTFind(T, 5) ? "找到" : "没找到（5 确实没插进去）");

    /* 递归版与循环版结果必须一致 */
    printf("\n两版一致性检查：\n");
    printf("  找 7 : 递归 %s，循环 %s\n",
           BSTFind(T, 7) ? "有" : "无", BSTFindIter(T, 7) ? "有" : "无");
    printf("  找 5 : 递归 %s，循环 %s\n",
           BSTFind(T, 5) ? "有" : "无", BSTFindIter(T, 5) ? "有" : "无");
    printf("（递归看思路，循环看工程 —— 尾递归都能这样改）\n");

    FreeTree(T);
    return 0;
}
//%driver-end

//%driver | 04
/* 验证 BSTInsert：每次插入后中序都应该保持有序 */
int main(void)
{
    static const int ins[] = { 8, 3, 10, 1, 6, 14, 4, 7, 13 };
    BinTree T = NULL;
    int i;

    for (i = 0; i < 9; i++)
    {
        T = BSTInsert(T, ins[i]);
        printf("插入 %2d 后中序: ", ins[i]);
        InOrder(T);
        printf("\n");
    }
    printf("\n（每一步都有序 —— 这就是 BST 插入的核心要求）\n");

    /* 重复值不该被插进去 */
    T = BSTInsert(T, 8);
    printf("再插一个重复的 8: ");
    InOrder(T);
    printf("\n（重复值被忽略，树没有变大）\n");

    FreeTree(T);
    return 0;
}
//%driver-end

//%driver | 05
/* 验证 FindMin / FindMax */
int main(void)
{
    static const int ins[] = { 8, 3, 10, 1, 6, 14, 4, 7, 13 };
    BinTree T = NULL;
    int i;

    for (i = 0; i < 9; i++)
    {
        T = BSTInsert(T, ins[i]);
    }

    printf("最小值 = %d（应该是最左下的 1）\n", FindMin(T)->data);
    printf("最大值 = %d（应该是最右下的 14）\n", FindMax(T)->data);

    /* 单结点树 */
    {
        BinTree one = NewNode(5);
        printf("只有一个结点时：最小 %d，最大 %d\n",
               FindMin(one)->data, FindMax(one)->data);
        free(one);
    }

    printf("（最小值一路往左到底，最大值一路往右到底）\n");

    FreeTree(T);
    return 0;
}
//%driver-end

//%driver | 06
/* 验证 BSTDelete 的三种情况 + 删不存在的值 */
int main(void)
{
    static const int ins[] = { 8, 3, 10, 1, 6, 14, 4, 7, 13 };
    BinTree T = NULL;
    int i;

    for (i = 0; i < 9; i++)
    {
        T = BSTInsert(T, ins[i]);
    }

    printf("初始      : ");
    InOrder(T);
    printf("\n");

    /* 情况一：叶子 */
    T = BSTDelete(T, 7);
    printf("删 7 叶子 : ");
    InOrder(T);
    printf("\n");

    /* 情况二：一个孩子（13 只有自己，14 只有左孩子 13）*/
    T = BSTDelete(T, 14);
    printf("删 14 单孩: ");
    InOrder(T);
    printf("\n");

    /* 情况三：两个孩子 */
    T = BSTDelete(T, 3);
    printf("删 3 双孩 : ");
    InOrder(T);
    printf("\n");

    /* 删根 */
    T = BSTDelete(T, 8);
    printf("删 8 树根 : ");
    InOrder(T);
    printf("\n");

    /* 不存在 */
    T = BSTDelete(T, 999);
    printf("删 999    : ");
    InOrder(T);
    printf("\n");

    printf("\n（每一步都必须保持有序 —— 一旦乱了就是删除写错了）\n");

    FreeTree(T);
    return 0;
}
//%driver-end

//%driver | 07
/* 验证 InOrder：BST 的中序一定递增 */
int main(void)
{
    static const int ins[] = { 8, 3, 10, 1, 6, 14, 4, 7, 13 };
    BinTree T = NULL;
    int i;

    for (i = 0; i < 9; i++)
    {
        T = BSTInsert(T, ins[i]);
    }

    printf("中序输出: ");
    InOrder(T);
    printf("\n");
    printf("（应当是 1 3 4 6 7 8 10 13 14 —— 严格递增就说明 BST 结构正确）\n");

    FreeTree(T);
    return 0;
}
//%driver-end

//%driver | 08
/* 验证 FreeTree：后序释放，先孩子后自己 */
int main(void)
{
    static const int ins[] = { 8, 3, 10, 1, 6 };
    BinTree T = NULL;
    int i;

    for (i = 0; i < 5; i++)
    {
        T = BSTInsert(T, ins[i]);
    }

    printf("释放前中序: ");
    InOrder(T);
    printf("\n");

    FreeTree(T);
    printf("整棵树已释放\n");
    printf("（必须是后序：先 free 根，孩子就再也找不到了）\n");

    return 0;
}
//%driver-end
