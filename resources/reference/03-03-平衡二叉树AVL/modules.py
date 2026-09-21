#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 结点里多存一个「高度」，用来算平衡因子。
#@d ============ 为什么要存高度 ============
#@d
#@d 平衡因子 = 左子树高 - 右子树高，AVL 要求它只能是 -1、0、1。
#@d
#@d 如果每次要判断平衡都现场递归求高度，插入一次就要 O(n) 的额外开销，
#@d 整体复杂度会退化。所以干脆**在结点里存一个高度字段**，插入时顺便更新，
#@d 用 O(1) 就能拿到。
#@d
#@d 这就是空间换时间的典型：每个结点多 4 个字节，换来判断平衡不用递归。
#@d
#@d ============ 空树的高度是多少 ============
#@d
#@d 约定成 **0**（而不是 -1）。这样：
#@d
#@d   叶子结点高度 = max(0, 0) + 1 = 1
#@d   只有一个孩子的结点 = max(孩子高, 0) + 1
#@d
#@d 式子统一，不用到处特判空指针。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 typedef struct AVLNode {...} 只是画了张"格子图"，真结点得 malloc 出来才能用；
#@d   Python 写个 class，AVLNode(5) 一调用结点就造好了，没有 malloc 也没有 free。
#@d   C 的 *left / *right 存的是地址，AVLTree 还是个"指向结点的指针"类型；
#@d   Python 里 left / right 直接存"另一个 AVLNode"，没孩子就存 None，
#@d   AVLTree 这个名字也不用再定义 —— 变量里装的就是结点本身。

#@s 数据元素类型
ElemType = int

#@s AVL 结点：比普通二叉树多一个 height
class AVLNode:
#@s 造结点时把数据、左子树、右子树、高度四个字段一次填好（C 那边得 malloc 完再一个个填）
    def __init__(self, data):
#@s 数据域
        self.data = data
#@s 左子树
        self.left = None
#@s 右子树
        self.right = None
#@d 新结点是叶子，高度先记成 1 —— C 里这一步写在 AVLInsert 的 malloc 后面
#@d （node->height = 1），Python 挪到构造里，省得每造一个结点都补一句。
#@s 以自己为根的子树高度（空树记 0）
        self.height = 1

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 在 Python 里就是个普通别名，这一节没有函数用它，
#@d 留在这里只是为了和 C 版一行一行对得上。
Status = int
#%end

#%module | 02 | Height | Height —— 求高度与更新 | 1 | 01 |
#%summary | 取高度要能容忍空树；更新高度就是「两个孩子取大的，再加一」。
#@d ============ 两个小函数，但是所有旋转的基础 ============
#@d
#@d **GetHeight(T)**：取一棵树的高度。空树返回 0。
#@d 把它单独包一层，是为了让后面的代码不用到处写 `T ? T->height : 0`。
#@d
#@d **UpdateHeight(T)**：重新算并写回 T 的高度。
#@d 注意它假设**孩子的高度已经是正确的** —— 所以调用时机永远是
#@d "先处理好孩子，再更新自己"，也就是后序的顺序。
#@d
#@d ============ 什么时候要更新 ============
#@d
#@d 旋转之后、插入回溯的路上，都要更新。
#@d 漏掉更新会出现"树看着是对的、平衡因子却是错的"这种最难查的 bug ——
#@d 因为它不会崩，只会在某次插入时做出错误的旋转判断。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 写 T->height 之前得先拿 T ? T->height : 0 挡一下空指针，所以才专门包了个 GetHeight；
#@d   Python 原样保留这一层，只把 T == NULL 写成 T is None、T->height 写成 T.height。
#@d   MaxInt 里 C 的三目运算符 a > b ? a : b 换成 Python 的 a if a > b else b，意思一样。
#@d   UpdateHeight 在 C 里是 void，Python 写一句光秃秃的 return，或者不写，都行。

#@s 取高度：空树是 0
def GetHeight(T):
#@s 空树高度 0
    if T is None:
        return 0
#@s 否则就是存着的那个值
    return T.height

#@s 取两个数的较大者
def MaxInt(a, b):
    return a if a > b else b

#@s 重新计算 T 的高度并写回
#@d 前提：T 的左右孩子高度都已经是对的
def UpdateHeight(T):
#@s 空树不用管
    if T is None:
        return
#@s 高度 = 两个孩子里高的那个 + 1
    T.height = MaxInt(GetHeight(T.left), GetHeight(T.right)) + 1

#@s 平衡因子 = 左高 - 右高
#@d AVL 要求它只能是 -1、0、1。绝对值到 2 就必须旋转了。
def BalanceFactor(T):
#@s 空树认为平衡
    if T is None:
        return 0
#@s 左减右
    return GetHeight(T.left) - GetHeight(T.right)
#%end

#%module | 03 | RotateLL | RotateLL —— 左单旋 | 2 | 01,02 |
#%summary | 麻烦出在「左孩子的左边」，把左孩子提上来当根。
#@d ============ 什么时候用：LL ============
#@d
#@d 判断口诀：**从出问题的结点往下走两步，方向都是「左」**，就是 LL。
#@d
#@d 插入前是平衡的：
#@d
#@d          5                   5
#@d         /                   /
#@d        3        插入 1 后   3          ← 5 的左子树高 2，右子树高 0，失衡
#@d                           /
#@d                          1
#@d
#@d 从 5 往下走：左（到 3）、再左（到 1）→ LL → 用**右单旋**。
#@d
#@d 旋转动作（把 3 提上来，5 降下去当它的右孩子）：
#@d
#@d          5                    3
#@d         /        →           / \
#@d        3                    1   5
#@d       /
#@d      1
#@d
#@d 为什么这样转完还是 BST？因为中序都是 1 3 5 —— 旋转**不改变中序**，
#@d 这是它能保持搜索树性质的根本原因。
#@d
#@d ============ 代码怎么写 ============
#@d
#@d 四步：
#@d   ① 记住左孩子（它要升上来当新根）
#@d   ② 把左孩子的右子树接到原来的根上（原来根的左边腾空）
#@d   ③ 让原来的根成为新根的右孩子
#@d   ④ 更新这两个结点的高度
#@d
#@d 第 ② 步是初学者最容易漏的 —— 少了它，左孩子的右子树就丢了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   这一段几乎是照着 C 抄的：C 本来就是"转完返回新的子树根"，Python 也照样返回。
#@d   只是 AVLTree newRoot = T->left; 写成 newRoot = T.left ——
#@d   C 要写明类型和指针，Python 不用声明类型，. 也不用写成 ->。
#@d   最后两句 UpdateHeight 的先后顺序和 C 一模一样，这个顺序千万别调。

#@s 右单旋（处理 LL 情况），返回新的子树根
def RotateLL(T):
#@s ① 新根就是左孩子
    newRoot = T.left

#@s ② 把新根的右子树挂到旧根的左边
#@d 这一步最容易忘。忘了就直接丢一棵子树。
    T.left = newRoot.right

#@s ③ 旧根成为新根的右孩子
    newRoot.right = T

#@s ④ 更新高度 —— 必须先更新旧根（它现在是孩子了）
#@d 顺序不能反：更新自己要用到孩子的高度，所以孩子得先算好。
    UpdateHeight(T)
    UpdateHeight(newRoot)

#@s 返回新根
    return newRoot
#%end

#%module | 04 | RotateRR | RotateRR —— 右单旋 | 2 | 01,02 |
#%summary | 麻烦出在「右孩子的右边」，把右孩子提上来当根。
#@d ============ 和 LL 完全镜像 ============
#@d
#@d 从出问题的结点往下走两步都是「右」→ RR → 用**左单旋**。
#@d
#@d          3                  3
#@d           \                    \
#@d            5     插入 7 后       5        ← 3 的右子树高 2，左子树高 0，失衡
#@d                                  \
#@d                                   7
#@d
#@d 旋转（把 5 提上来）：
#@d
#@d        3                      5
#@d         \        →           / \
#@d          5                  3   7
#@d           \
#@d            7
#@d
#@d 代码就是把 LL 的 left / right 全反过来：
#@d
#@d   RotateLL：newRoot = T->left;   T->left = newRoot->right;   newRoot->right = T;
#@d   RotateRR：newRoot = T->right;  T->right = newRoot->left;   newRoot->left = T;
#@d
#@d ============ 名字的坑 ============
#@d
#@d 注意命名：**LL 用右旋，RR 用左旋** —— 方向和名字是反的。
#@d 名字说的是"麻烦在哪"（LL = 左孩子的左边），不是"往哪转"。
#@d 记混了会写出把树转歪的代码，而且往往还能跑，只是不再平衡。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   和 RotateLL 一个套路：C 返回新根，Python 也返回新根，调用者照样得接住。
#@d   三句指针操作换成 T.right = newRoot.left 这样的写法，左右正好和 LL 对着来。
#@d   C 里 T->right 的 -> 在 Python 里就是一个点，别的没动。

#@s 左单旋（处理 RR 情况），返回新的子树根
def RotateRR(T):
#@s ① 新根是右孩子
    newRoot = T.right

#@s ② 新根的左子树改挂到旧根的右边
    T.right = newRoot.left

#@s ③ 旧根成为新根的左孩子
    newRoot.left = T

#@s ④ 先更新旧根，再更新新根
    UpdateHeight(T)
    UpdateHeight(newRoot)

#@s 返回新根
    return newRoot
#%end

#%module | 05 | RotateLR | RotateLR —— 左右双旋 | 3 | 01,02,03,04 |
#%summary | 麻烦在「左孩子的右边」，先对左孩子左旋、再对自己右旋。
#@d ============ 单旋搞不定的情况 ============
#@d
#@d          5                 5
#@d         /                 /
#@d        3      插入 4 后   3        ← 5 失衡了
#@d                            \
#@d                             4
#@d
#@d 从 5 往下走：左（到 3）、再右（到 4）→ **LR**。
#@d
#@d 这时候直接右单旋行不行？试试看：
#@d
#@d          5                3
#@d         /                / \
#@d        3        →       1*  5     转完还是不平衡！
#@d         \
#@d          4
#@d
#@d 因为麻烦藏在"左孩子的右边"，直接转会把那棵子树原样带过去。
#@d
#@d ============ 分两步 ============
#@d
#@d **先对左孩子做一次左旋**，把它变成 LL 的样子，**再对自己做右单旋**：
#@d
#@d      5            5                4
#@d     /            /                / \
#@d    3      →     4        →       3   5
#@d     \          /
#@d      4        3
#@d
#@d 第一步（对 3 左旋）之后，5 的左边就是"左孩子的左边"了 —— 变成 LL，
#@d 于是第二步照 LL 处理即可。
#@d
#@d ============ 本质 ============
#@d
#@d 双旋不是"新的旋转类型"，只是**把两种情况拆成两次单旋**。
#@d 理解了这点，RL 就不用另记了 —— 它是对称的。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   这两句 Python 和 C 一模一样，只是把 T->left 写成 T.left。
#@d   注意第一句的赋值不能省：RotateRR 转完，左孩子已经换成别人了，得把它接回左边。
#@d   第二句直接 return RotateLL(T)，和 C 的 return RotateLL(T); 是一回事。

#@s 左右双旋（处理 LR），返回新的子树根
def RotateLR(T):
#@s 第一步：先对左孩子做左单旋，把 LR 掰成 LL
    T.left = RotateRR(T.left)

#@s 第二步：再对自己做右单旋（这一步就是 LL 的处理方式）
    return RotateLL(T)
#%end

#%module | 06 | RotateRL | RotateRL —— 右左双旋 | 3 | 01,02,03,04 |
#%summary | 麻烦在「右孩子的左边」，先对右孩子右旋、再对自己左旋。
#@d ============ LR 的镜像 ============
#@d
#@d          3                3
#@d           \                \
#@d            5     插入 4 后  5       ← 3 失衡
#@d                           /
#@d                          4
#@d
#@d 从 3 往下：右（到 5）、再左（到 4）→ **RL**。
#@d
#@d 处理方式和 LR 完全对称：
#@d
#@d   ① 先对右孩子做一次右单旋，把 RL 掰成 RR
#@d   ② 再对自己做左单旋
#@d
#@d      3              3                4
#@d       \              \              / \
#@d        5      →       4      →     3   5
#@d       /                \
#@d      4                  5
#@d
#@d ============ 四种旋转汇总 ============
#@d
#@d   名字   麻烦在哪          怎么转
#@d   ────  ───────────────  ──────────────────────
#@d   LL    左孩子的左边      对自己右单旋
#@d   RR    右孩子的右边      对自己左单旋
#@d   LR    左孩子的右边      先对左孩子左旋，再对自己右旋
#@d   RL    右孩子的左边      先对右孩子右旋，再对自己左旋
#@d
#@d 记忆窍门：**单旋 = 麻烦在外侧，双旋 = 麻烦在内侧**。
#@d 双旋的第一步永远是"把内侧的麻烦挪到外侧去"。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   和 RotateLR 完全对着来：那边接的是 T.left，这边接的是 T.right。
#@d   先调 RotateLL 把右孩子那一坨掰成 RR，再拿 RotateRR 收拾自己，和 C 一个顺序。
#@d   两个函数都返回新根，所以 Python 这边也要 return，不能只调用不接返回值。

#@s 右左双旋（处理 RL），返回新的子树根
def RotateRL(T):
#@s 第一步：先对右孩子做右单旋，把 RL 掰成 RR
    T.right = RotateLL(T.right)

#@s 第二步：再对自己做左单旋
    return RotateRR(T)
#%end

#%module | 07 | AVLInsert | AVLInsert —— 插入并自动平衡 | 3 | 01,02,03,04,05,06 |
#%summary | 先按 BST 插进去，回溯时更新高度、发现失衡就转。
#@d ============ 插入的四步 ============
#@d
#@d   ① 按 BST 的规矩往下走，走到空位置造结点
#@d   ② **回溯的路上**更新自己的高度
#@d   ③ 算平衡因子，如果绝对值到 2 就判断是哪种情况
#@d   ④ 对应的旋转，返回新的子树根
#@d
#@d 关键在于**第 ② 步的位置**：更新高度必须在递归回来之后、
#@d 也就是"孩子都处理好了"，这正是后序的顺序。
#@d
#@d ============ 谁先失衡 ============
#@d
#@d 插入只会让**从新结点到根这条路径上**的结点失衡，而且
#@d **最先失衡的一定是离新结点最近的那个**。
#@d
#@d 递归回溯天然是从下往上走的，所以遇到的第一个失衡结点就是它 ——
#@d 转它一次，整棵树就恢复平衡了（不需要继续往上修）。
#@d 这也是 AVL 插入只要 O(log n) 的原因。
#@d
#@d ============ 判断属于哪种情况 ============
#@d
#@d 先看平衡因子：
#@d
#@d   左高（BF > 1）→ 麻烦在左边，再看左孩子的哪边高
#@d        左孩子的左边高（BF(左孩子) >= 0）→ LL
#@d        左孩子的右边高（BF(左孩子) <  0）→ LR
#@d
#@d   右低（BF < -1）→ 麻烦在右边，对称处理
#@d
#@d 注意判断用的是**左孩子的平衡因子**，不是"新插入的值比左孩子大还是小" ——
#@d 两者有时结论不同，用平衡因子才可靠。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 在空位置那一段要 malloc、挡"内存分配失败"、再填四个字段，Python 一句
#@d   AVLNode(x) 就全干完了 —— 所以"内存分配失败\n"这行提示在 Python 版里没有，
#@d   造结点也不会失败，不用 exit(1)。（AVLNode 的高度默认就是 1，正好是新叶子的高度。）
#@d   C 用一对花括号 { int bf = ...; } 把第 ③ 步圈起来，Python 靠缩进分段，大括号不用写。
#@d   返回新根这件事两边一样：旋转换了根，所以 T = AVLInsert(T, x) 这句必须写。

#@s 插入 x，返回新的子树根
def AVLInsert(T, x):
#@s ① 走到空位置，造结点（新结点高度是 1）
    if T is None:
#@s 造结点：数据填 x，左右是 None，高度 1（C 那边要 malloc 完再一个个填）
        return AVLNode(x)

#@s 比当前小 → 插到左子树
    if x < T.data:
        T.left = AVLInsert(T.left, x)
#@s 比当前大 → 插到右子树
    elif x > T.data:
        T.right = AVLInsert(T.right, x)
#@s 相等 → 不插（和 BST 一致）
    else:
        return T

#@s ② 回溯到这一步时孩子已经处理好了，更新自己的高度
    UpdateHeight(T)

#@s ③ 算平衡因子，看有没有失衡
#@s 平衡因子
    bf = BalanceFactor(T)

#@s 左边太高
    if bf > 1:
#@s 再看左孩子：左边高是 LL，右边高是 LR
#@d 用 >= 0 而不是 > 0，是为了把"左孩子平衡"也归到 LL ——
#@d 那种情况下单旋就够了。
        if BalanceFactor(T.left) >= 0:
#@s LL：右单旋
            return RotateLL(T)
#@s LR：先左后右的双旋
        return RotateLR(T)

#@s 右边太高（镜像处理）
    if bf < -1:
#@s 右孩子右边高是 RR，左边高是 RL
        if BalanceFactor(T.right) <= 0:
#@s RR：左单旋
            return RotateRR(T)
#@s RL：先右后左的双旋
        return RotateRL(T)

#@s ④ 没失衡，原样返回
    return T
#%end

#%module | 08 | InOrder | InOrder —— 中序验证 | 1 | 01 |
#%summary | 旋转不改变中序 —— 所以中序有序就说明树还是 BST。
#@d ============ 为什么旋转不会破坏 BST ============
#@d
#@d 因为旋转只是**换了父子关系，没有换左右顺序**。
#@d
#@d 以 LL 为例：
#@d
#@d       5                3
#@d      /                / \
#@d     3        →       1   5
#@d    /
#@d   1
#@d
#@d 两棵树的中序都是 **1 3 5**。中序不变，而中序就是排序顺序，
#@d 所以 BST 的性质保住了。
#@d
#@d 这也是验证 AVL 写没写对的两把尺子之一：
#@d
#@d   ① 中序必须递增          → 还是 BST
#@d   ② 每个结点的平衡因子都在 -1..1 → 还是平衡的
#@d
#@d 两个都对，这棵树就合格了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   三行递归和 C 一字不差，先左、再自己、后右。
#@d   只有 printf("%d ", T->data) 换成了 print(T.data, end=' ')。
#@d   那个 end=' ' 千万不能丢：Python 的 print 默认末尾补换行，C 的 printf 不会，
#@d   丢了就一个数占一行，和 C 版的输出对不上（C 是每个数后面跟一个空格）。

#@s 中序遍历，顺便看是不是有序
def InOrder(T):
#@s 空树返回
    if T is None:
        return
#@s 左
    InOrder(T.left)
#@s 根
    print(T.data, end=' ')
#@s 右
    InOrder(T.right)
#%end

#%module | 09 | FreeTree | FreeTree —— 释放整棵树 | 2 | 01 |
#%summary | 后序释放：先孩子、后自己。
#@d 和普通二叉树一样，AVL 也必须后序释放 —— 先 free 根就再也找不到孩子了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的最后一步是 free(T)，把这块内存还给系统；Python 里没有 free 这个东西。
#@d   下面两句只是把通到孩子的那两根线剪断，好把"先孩子、后自己"这个顺序演出来。
#@d   其实这个函数一行都不干也行：没人再引用这棵树时，Python 会自己把整棵树收走。

#@s 后序释放
def FreeTree(T):
#@s 空树返回
    if T is None:
        return
#@s 先孩子
    FreeTree(T.left)
    FreeTree(T.right)
#@s 后自己
    T.left = None
    T.right = None
#%end

#%module | 10 | CheckBalance | CheckBalance —— 逐结点检查平衡 | 2 | 01,02 |
#%summary | 递归看每个结点的平衡因子是否都在 -1..1 之间。
#@d ============ 验证 AVL 的两把尺子 ============
#@d
#@d 写完 AVL 要用两个条件自查：
#@d
#@d   ① 中序递增          → 还是 BST（旋转不改变中序）
#@d   ② 每个结点都平衡     → 确实做到了 AVL 的要求
#@d
#@d 第一个用 InOrder 看输出，第二个就是这个函数。
#@d 两个都过，这棵树才合格。
#@d
#@d 只查根是不够的 —— 旋转写出问题时，往往是某个子树里失衡，
#@d 而根看起来还正常。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 || 和 && 在 Python 里写成 or 和 and，判断的先后顺序没变。
#@d   两个 CheckBalance 都只返回 1 或 0，所以 and 连起来的结果也是 1 或 0，
#@d   和 C 的 && 一样，调用者拿去当条件用不会出岔子。
#@d   printf 换成 print + f-string，%d 的位置直接把 T.data 塞进大括号里。

#@s 检查每个结点的平衡因子是否都在 -1..1
#@d 返回 1 表示全部合法
def CheckBalance(T):
#@s 空树算合法
    if T is None:
        return 1
#@s 自己失衡就直接返回 0
#@d 平衡因子的绝对值超过 1 就是不合格的 AVL。
    if BalanceFactor(T) > 1 or BalanceFactor(T) < -1:
        print(f'  结点 {T.data} 失衡，平衡因子 = {BalanceFactor(T)}')
        return 0
#@s 两个孩子也都要合法
    return CheckBalance(T.left) and CheckBalance(T.right)
#%end

#%module | 11 | main | main —— 让 AVL 自己找平衡 | 3 | 01,02,03,04,05,06,07,08,09,10 |
#%summary | 故意用有序序列插入，看它怎么把自己掰平衡。
#@d ============ 这个测试为什么用有序序列 ============
#@d
#@d 因为**有序序列正是普通 BST 的死穴** —— 1 2 3 4 5 6 7 会退化成一条链。
#@d
#@d 而 AVL 会把这种输入自动掰成一棵平衡树。用它来测，最能看出价值。
#@d
#@d ============ 顺便验证两件事 ============
#@d
#@d   ① 中序递增 → 旋转没破坏 BST 性质
#@d   ② 根的高度 ≈ log2(n+1) → 树确实是平衡的
#@d
#@d 7 个结点的平衡树高度是 3（2³-1 = 7）。如果打出来是 7，
#@d 说明根本没平衡，得回头查旋转。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 是运行时自动调用的；Python 自己写一句
#@d       if __name__ == '__main__':
#@d   意思是"只有直接运行这个文件时才执行，被别人 import 时不执行"。
#@d   C 的 static const int ins[] = {...}; 到 Python 就是一个列表 ins = [...]，
#@d   for (i = 0; i < 7; i++) 换成 for i in range(7)，printf 全换成 print，
#@d   几个 \n 还是几个 \n，空格和全角冒号都照抄，输出才能和 C 版一个字节都不差。

#@s 主函数
if __name__ == '__main__':
#@s 故意用有序序列 —— 这正是普通 BST 会退化的情况
    ins = [1, 2, 3, 4, 5, 6, 7]
#@s 计数
#@s 树根
#@d C 在这儿写了 int i; 和 AVLTree T = NULL; 两句声明；Python 不用声明，
#@d i 交给下面的 range(7) 直接给，T 从 None 开始，所以两句注释挨在一起。
    T = None

#@s 打印说明
    print('插入序列：1 2 3 4 5 6 7（普通 BST 会退化成一条链）\n')

#@s 逐个插入并观察
    for i in range(7):
        T = AVLInsert(T, ins[i])
        print(f'插入 {ins[i]} 后：根 = {T.data}，树高 = {T.height}，中序: ', end='')
        InOrder(T)
        print()

#@s 验证 ①：中序必须递增
    print('\n① 中序结果：', end='')
    InOrder(T)
    print('\n   （必须递增 —— 说明旋转没有破坏 BST 性质）')

#@s 验证 ②：树高应该是 3
    print(f'\n② 树高 = {T.height}（7 个结点的平衡树应该是 3）')
    print('   普通 BST 按这个顺序插会变成高度 7 的链')

#@s 验证 ③：每个结点都平衡
    print('\n③ 逐结点检查平衡因子：', end='')
    if CheckBalance(T):
        print('全部在 -1..1 之间，合格')

#@s 释放
    FreeTree(T)
#@s 正常结束
#@d C 的 main 最后要写 return 0;，Python 的脚本跑完就算正常结束，不用写。
#%end
