#%module | 01 | typedef | 头文件与 typedef | 2 |
#%summary | 用数组存完全二叉树：父子靠下标算，不需要指针。
#@d ============ 为什么堆不用指针 ============
#@d
#@d 普通二叉树有"歪"的可能，所以必须用指针一个个接。但堆是**完全二叉树**：
#@d 除了最后一层，每一层都是满的，最后一层还靠左排。
#@d
#@d 形状这么规整，就带来一个漂亮的结果：**层序编号一确定，父子关系就确定了**。
#@d
#@d          1                 下标:  1  2  3  4  5  6
#@d        /   \                     ┌──┬──┬──┬──┬──┬──┐
#@d       3     2                data│─ │ 1│ 3│ 2│ 6│ 7│ 5│
#@d      / \   /                     └──┴──┴──┴──┴──┴──┴──┘
#@d     6   7 5
#@d
#@d   下标 1 的孩子是 2 和 3   →  左孩子 2i、右孩子 2i+1
#@d   下标 2 的孩子是 4 和 5   →  父结点是 i/2
#@d
#@d 所以整棵树就是一段连续内存，连一个指针都不用。
#@d
#@d ============ 0 号位置为什么空着 ============
#@d
#@d 为了让 i/2、2i、2i+1 这三个式子成立，下标必须从 **1** 开始。
#@d 所以数组的第 0 个位置通常空着，或者放一个"哨兵"值
#@d （一个比所有元素都小的数），这样上浮时不用判断边界。
#@d
#@d ============ 堆能做什么、不能做什么 ============
#@d
#@d   能：O(1) 拿到最小值；O(log n) 插入、删除最小值
#@d   不能：查找任意值（要 O(n) 挨个找）
#@d
#@d 因为堆只保证"父 <= 子"，**兄弟之间、叔侄之间没有任何大小约定**。
#@d 这一点和 BST 完全不同 —— 别把两者搞混。

#@s 堆能容纳的最大元素数
MAXN = 1000

#@s 哨兵：比所有可能出现的值都小
#@d 放在 0 号位置，上浮时写到它就会自然停下，省掉一次边界判断。
MINDATA = -1000000

#@s 最小堆
#@d C 的 struct 到 Python 就是一个 class，三个字段的名字一个都没改。
#@d 这里选的是"class 只用来装数据，函数还是自由函数"：
#@d 这样 C 的 PercDown(H, 1) 到 Python 还是 PercDown(H, 1)，
#@d 不用改写成 H.PercDown(1)，和教材上的代码对得最齐。
class MinHeap:
    def __init__(self):
        #@s 存储元素的数组，0 号位置放哨兵
        #@d Python 的列表本来从 0 开始，这里故意空出下标 0 以对齐教材：
        #@d data[0] 留给哨兵，真元素从 data[1] 开始，
        #@d 父子关系才正好是 2i / 2i+1 / i/2 这三个式子。
        self.data = None
        #@s 当前元素个数（不是容量）
        self.size = 0
        #@s 容量上限
        self.capacity = 0

#@s 状态码
#@d C 里是 #define 宏，Python 直接写两个普通变量，用起来一样。
OK = 1
ERROR = 0

#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 typedef int Status; 是给返回值起个别名，Python 不看类型，这句直接省了。
#@d   C 的 H->data、H->size 到 Python 是 H.data、H.size，箭头换成一个小圆点。
#@d   C 的数组是 malloc 出来的一大块内存，Python 的 data 就是一个普通列表，
#@d   所以这里先写 data = None，等 CreateHeap 里再开格子，和 C 的先后顺序一样。
#%end

#%module | 02 | CreateHeap | CreateHeap —— 建一个空堆 | 1 | 01 |
#%summary | 分配好数组、放上哨兵，size 归零。
#@d ============ 哨兵的作用 ============
#@d
#@d 把 0 号位置设成一个"比所有元素都小"的值，上浮循环就能写成：
#@d
#@d     for (i = p; H->data[i/2] > x; i /= 2) ...
#@d
#@d 而不用额外判断 i > 1。因为写到 0 号位置时条件一定不成立，循环自然结束。
#@d
#@d 这是个很典型的小技巧：**用一个不可能被越过的值来省掉边界检查**。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 要 malloc 两次：一次给结构、一次给数组，还得自己乘 sizeof 算字节数。
#@d   Python 一个 [0] * (capacity + 1) 就是 capacity+1 个现成格子，一次搞定。
#@d   0 号格照样要塞哨兵 MINDATA —— 这一格漏了，上浮的边界就变了。
#@d   C 的 H->size 到 Python 是 H.size，别的写法一字不差。

#@s 建一个能装 capacity 个元素的最小堆
def CreateHeap(capacity):
    #@s 分配堆结构本身
    #@d C 是 H = (MinHeap *)malloc(sizeof(MinHeap));，Python 写 H = MinHeap()。
    H = MinHeap()
    #@s 分配数组：多开一格给哨兵
    #@d C 那个 +1 藏不住：capacity 个元素必须开 capacity + 1 个格子。
    H.data = [0] * (capacity + 1)
    #@s 0 号放哨兵
    H.data[0] = MINDATA
    #@s 当前没有元素
    H.size = 0
    #@s 记下容量
    H.capacity = capacity
    #@s 返回
    return H

#@s 释放堆
def FreeHeap(H):
    #@s 先放数组
    #@d C 在这个位置是 if (H == NULL) { return; }，Python 写 H is None 是一个意思。
    if H is None:
        return
    #@s 再放结构
    #@d Python 没有 free，把 data 丢给垃圾回收、size 归零，等于说"我不再用它了"。
    H.data = None
    H.size = 0
#%end

#%module | 03 | PercDown | PercDown —— 向下调整（下沉） | 3 | 01 |
#%summary | 把位置 p 上的元素一路往下沉，直到父不大于子。
#@d ============ 下沉在做什么 ============
#@d
#@d 假设 p 位置放了一个"不该在这儿"的较大元素，要把它沉到合适的位置：
#@d
#@d   ① 看两个**孩子**里谁更小
#@d   ② 如果自己 <= 那个更小的孩子，说明位置对了，停
#@d   ③ 否则把孩子搬上来、自己沉下去，继续比较
#@d
#@d 走一遍（最小堆 {1,3,2,6,7,5}，把 0 号哨兵换上去后下沉）：
#@d
#@d        1                 把 8 放到根上
#@d      /   \
#@d     3     2
#@d    / \   /
#@d   6   7 5
#@d
#@d        8                 孩子 3 和 2，2 更小 → 2 搬上来
#@d      /   \
#@d     3     2
#@d          ↑ 8 沉到这儿
#@d
#@d        2
#@d      /   \
#@d     3     8             8 的孩子是 5 → 5 更小 → 5 搬上来
#@d    / \   /
#@d   6   7 5
#@d
#@d        2
#@d      /   \
#@d     3     5             8 没有孩子了，停下来
#@d    / \   /
#@d   6   7 8
#@d
#@d ============ 一个容易写错的地方 ============
#@d
#@d `if (child != H->size && ...)` —— 这个判断是必须的。
#@d
#@d 当 parent 只有一个左孩子时（完全二叉树里很常见），child 就等于 size，
#@d 没有右孩子。这时如果去比 data[child+1]，读到的是**堆外面的内存**。
#@d 概率不高但一定会在某个规模上突然出错，很难查。
#@d
#@d 判断"有没有右孩子"用的是 `child != H->size`，
#@d 而不是 `child < H->size` 或者 `child + 1 <= H->size` ——
#@d 想清楚"size 是最后一个元素的下标"就不容易写错了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 for 把"初值、条件、步进"三件事挤在一行，Python 只有 while 加条件，
#@d   所以初值 parent = p 提到循环前面，步进 parent = child 挪到循环体最后一句。
#@d   C 读到堆外面的内存它不吭声，Python 的列表越界会当场 IndexError；
#@d   不过 child != H.size 这个判断两边都得写对，写错了算出来的位置就是错的。

#@s 把位置 p 上的元素向下沉到合适的位置
def PercDown(H, p):
    #@s 父结点下标（会一路往下走）
    #@s 较小的孩子下标
    #@s 暂存要下沉的元素 —— 不急着写回去，等位置定了再写
    #@d C 上面还有 int parent; int child; int x; 三行声明，
    #@d Python 不用提前声明变量，名字在下面第一次赋值的地方就出现了。

    #@s 先把要下沉的元素取出来
    x = H.data[p]

    #@s 沿着"较小的孩子"一路往下
    #@d parent * 2 <= H->size 表示还有左孩子（完全二叉树里，有左孩子就够判断）
    parent = p
    while parent * 2 <= H.size:
        #@s 先假设较小的孩子是左孩子
        child = parent * 2

        #@s 如果有右孩子、且右孩子更小，就换成右孩子
        #@d child != H->size 这个判断千万不能省，否则会读到堆外面的内存。
        #@d 因为 size 是"最后一个元素的下标"，child == size 表示左孩子就是最后一个，
        #@d 根本没有右孩子。
        if child != H.size and H.data[child] > H.data[child + 1]:
            child += 1

        #@s 如果自己已经不大于那个较小的孩子，位置就对了
        if x <= H.data[child]:
            break

        #@s 否则把小一点的孩子搬上来，自己继续往下比
        H.data[parent] = H.data[child]

        parent = child

    #@s 循环结束时 parent 就是该待的位置
    H.data[parent] = x
#%end

#%module | 04 | PercUp | PercUp —— 向上调整（上浮） | 2 | 01 |
#%summary | 把位置 p 上的元素一路往上顶，直到父不大于它。
#@d ============ 上浮和下沉是镜面对称 ============
#@d
#@d   下沉：跟**孩子**比，比自己小的就搬上来
#@d   上浮：跟**父亲**比，比自己大的就压下去
#@d
#@d 上浮用在**插入**：新元素先放到数组末尾（保持完全二叉树的形状），
#@d 然后让它一路往上浮到合适的位置。
#@d
#@d 走一遍：往 {1,3,2,6,7,5} 里插入 0
#@d
#@d        1                先放到末尾
#@d      /   \
#@d     3     2
#@d    / \   / \
#@d   6   7 5   0
#@d
#@d        1                0 比父亲 2 小 → 2 压下来，0 上去
#@d      /   \
#@d     3     0
#@d    / \   / \
#@d   6   7 5   2
#@d
#@d        0                0 比父亲 1 小 → 1 压下来，0 成了根
#@d      /   \
#@d     3     1
#@d    / \   / \
#@d   6   7 5   2
#@d
#@d ============ 哨兵在这里发挥作用 ============
#@d
#@d 循环条件里有 `H->data[i/2] > x`。当 i 走到 1 时，i/2 = 0，
#@d 而 0 号位置是 MINDATA —— 一定不大于 x，循环自然停下。
#@d
#@d 所以不用写 `i > 1 &&` 这个边界判断。哨兵值就是这么省事的。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 for 把 i = p、条件、i /= 2 挤在一行，Python 拆成 while：
#@d   初值写在循环前面，i //= 2 挪到循环体最后一句，执行顺序和 C 一模一样。
#@d   C 的 i / 2 是整数除法，Python 必须写成 i // 2，写单个斜杠就变成小数了。
#@d   哨兵那句照样管用：i 走到 1 时读的是 data[0] = MINDATA，循环自己就停下。

#@s 把位置 p 上的元素向上浮到合适的位置
def PercUp(H, p):
    #@s 当前位置
    #@s 暂存要上浮的元素
    #@d C 上面是 int i; int x; 两行声明，Python 不用声明，直接用就是了。

    #@s 取出元素
    x = H.data[p]

    #@s 只要父亲比自己大，就让父亲下来，自己继续往上
    #@d 边界靠 0 号哨兵兜住：i 到 1 时，data[0] = MINDATA 一定不满足条件。
    i = p
    while H.data[i // 2] > x:
        H.data[i] = H.data[i // 2]
        i //= 2

    #@s 落位
    H.data[i] = x
#%end

#%module | 05 | BuildHeap | BuildHeap —— 建堆 | 3 | 01,03 |
#%summary | 从最后一个非叶结点开始，逐个往前下沉 —— O(n)，不是 O(n log n)。
#@d ============ 建堆为什么从 n/2 开始 ============
#@d
#@d 完全二叉树里，**下标大于 n/2 的结点全都是叶子**。
#@d
#@d   n = 7 时，n/2 = 3：
#@d
#@d          1        ← 需要调整（有孩子）
#@d        /   \
#@d       2     3     ← 2、3 需要调整（有孩子）
#@d      / \   / \
#@d     4   5 6   7   ← 4~7 都是叶子，不用调整
#@d
#@d 叶子没有孩子，本来就是一个合法的堆，不用管。
#@d 所以只需要从最后一个"有孩子的结点"（也就是 n/2）开始，
#@d **往前**逐个下沉。
#@d
#@d ============ 为什么是 O(n) 而不是 O(n log n) ============
#@d
#@d 看起来像"n/2 次下沉、每次最多 log n 层"，那不就 O(n log n) 吗？
#@d
#@d 但**大部分结点都在底层，它们下沉的距离很短**：
#@d
#@d   倒数第一层（叶子）：不用调
#@d   倒数第二层：最多沉 1 层        ← 结点很多
#@d   倒数第三层：最多沉 2 层        ← 结点少一半
#@d   ...
#@d   根：最多沉 log n 层            ← 只有 1 个
#@d
#@d 把每层的"结点数 × 下沉层数"加起来，这个级数是收敛的，总和是 O(n)。
#@d
#@d 相比之下，**逐个插入**建堆是 O(n log n) —— 因为每个新元素都要浮到顶上。
#@d 所以"一次性给一堆数"的时候要用 BuildHeap，不要一个个 Insert。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 for (i = H->size / 2; i > 0; i--) 到 Python 写成
#@d   range(H.size // 2, 0, -1)，吐出来正好是 n/2、n/2-1 …… 一直到 1，一个不差。
#@d   C 的 int i; 那行声明也不用写，for 自己会把 i 造出来。
#@d   循环里调 PercDown(H, i) 的写法和 C 一模一样，因为它就是个自由函数。

#@s 把已有数据整理成一个合法的最小堆
#@d 调用前要把数据填进 H->data[1..size]，并把 size 设好
def BuildHeap(H):
    #@s 从最后一个非叶结点开始
    #@d C 这里是 int i; 那一行，Python 的 for 自己造 i，不用先声明。

    #@s 逐个往前下沉
    #@d 从 n/2 递减到 1。之所以往前而不是往后，是因为下沉要保证
    #@d "子树已经是堆" —— 从后往前才能满足这个前提。
    for i in range(H.size // 2, 0, -1):
        PercDown(H, i)
#%end

#%module | 06 | Insert | Insert —— 插入 | 2 | 01,04 |
#%summary | 放到末尾（保持形状），再上浮到合适位置。
#@d ============ 插入两步 ============
#@d
#@d ① **放到数组末尾**：这样完全二叉树的形状一定还是合法的
#@d ② **上浮**：把它往上顶到合适位置，恢复堆序
#@d
#@d 为什么必须先放末尾？如果随便找个位置插，形状就破了，
#@d 父子下标关系也就不成立了 —— 那样"用数组存树"这个前提就没了。
#@d
#@d 所以堆的插入顺序是固定的：
#@d
#@d     形状优先（放末尾） → 再调顺序（上浮）
#@d
#@d 删除正好相反：**先调顺序（把末尾元素搬到根、再下沉），形状自然保持**。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 那句 H->data[++H->size] = x; 把"个数加一"和"存进去"挤在一行里，
#@d   Python 不能这么写，只能拆成两行：先 H.size += 1，再 H.data[H.size] = x。
#@d   顺序不能反，反了就把前一个元素盖掉了。
#@d   C 返回的是 Status（其实就是 int），Python 照样返回 OK / ERROR 这两个数。

#@s 插入元素 x
def Insert(H, x):
    #@s 满了就拒绝
    if H.size >= H.capacity:
        return ERROR

    #@s ① 放到末尾，个数加一
    H.size += 1
    H.data[H.size] = x

    #@s ② 上浮到合适位置
    PercUp(H, H.size)

    #@s 成功
    return OK
#%end

#%module | 07 | DeleteMin | DeleteMin —— 删除最小值 | 2 | 01,03 |
#%summary | 把末尾元素搬到根上，再一路下沉。
#@d ============ 删除最小值 ============
#@d
#@d 最小值就在根上（1 号位置），拿走很容易。麻烦的是**补位**：
#@d
#@d ① 记下根的值（这是要返回的答案）
#@d ② **把最后一个元素搬到根上**，size 减一
#@d ③ 让这个元素下沉到合适位置
#@d
#@d 走一遍（最小堆 {1,3,2,6,7,5}，删最小值）：
#@d
#@d        1                  ① 记下 1
#@d      /   \
#@d     3     2
#@d    / \   /
#@d   6   7 5
#@d
#@d        5                  ② 把末尾的 5 搬到根上，size 从 6 变 5
#@d      /   \
#@d     3     2
#@d    / \
#@d   6   7
#@d
#@d        2                  ③ 5 的孩子是 3 和 2，2 更小 → 2 搬上来
#@d      /   \
#@d     3     5
#@d    / \
#@d   6   7
#@d
#@d ============ 为什么搬末尾元素 ============
#@d
#@d 因为搬走末尾元素之后，**剩下的还是一棵完全二叉树**，形状没破。
#@d
#@d 如果随便挑一个元素搬到根上，形状就乱了，数组存树的前提也就没了。
#@d 这个思路和插入刚好对称：一个"先保形状再调顺序"，一个"先调顺序自然保形状"。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 last = H->data[H->size--]; 一句话里干了"取值"和"个数减一"两件事，
#@d   Python 没有 -- 运算符，只能写成 last = H.data[H.size] 再 H.size -= 1。
#@d   这里没有 C 那种 ElementType *e 出口参数，答案直接 return 出去就行；
#@d   空堆要走的那条路也一样，return MINDATA 让调用者一眼能看出是空堆。

#@s 删除并返回最小值；空堆返回 MINDATA
def DeleteMin(H):
    #@s 答案
    #@s 最后一个元素
    #@d C 上面是 int minItem; int last; 两行声明，Python 不用声明。

    #@s 空堆没法删
    if H.size == 0:
        return MINDATA

    #@s ① 根就是最小值，先记下来
    minItem = H.data[1]

    #@s ② 把最后一个元素搬到根上，并让 size 减一
    #@d 注意是"搬到根上"，不是"丢掉" —— 末尾那格从此不属于堆了，
    #@d 它的值正好用来填根的空缺。
    last = H.data[H.size]
    H.size -= 1
    H.data[1] = last

    #@s ③ 让它下沉到合适位置
    #@d size 已经减过了，所以 PercDown 看到的是一棵少了末尾元素的树。
    PercDown(H, 1)

    #@s 返回答案
    return minItem
#%end

#%module | 08 | PrintHeap | PrintHeap —— 打印与自查 | 2 | 01 |
#%summary | 打印数组顺序；再逐个结点检查「父不大于子」。
#@d ============ 怎么自查堆对不对 ============
#@d
#@d 光看数组打印是看不出堆序的 —— 那只是一串数字。
#@d 所以这里给两个工具：
#@d
#@d   PrintHeap   把元素按数组顺序打出来
#@d   CheckHeap   逐个检查每个结点是否 <= 它的孩子
#@d
#@d 第二个体检尤其重要。堆的 bug 往往不会崩，只是"顺序悄悄错了"，
#@d 例如下沉方向反了、更新漏了。用 CheckHeap 一跑就露馅。
#@d
#@d 还要注意：**数组打印顺序不代表任何大小关系**。
#@d 堆只保证父子之间有序，兄弟之间是乱的。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 printf("%d ", x) 每个数后面都带一个空格，连最后一个也有；
#@d   Python 不能图省事写成 ' '.join(...)，那样最后会少一个空格，输出就对不上了。
#@d   所以这里老老实实写 print(x, end=' ')，一个元素一个元素地打。
#@d   带中文的那几行要拼成一条 f-string，写成 print(a, b) 会自己多塞一个空格。

#@s 打印堆里的元素（数组顺序）
def PrintHeap(tag, H):
    #@d C 这里是 int i; 那一行，Python 的 for 自己造 i。
    #@d 开头的 tag 和 size 用一条 f-string 拼完再加 end=''，别加换行。
    print(f'{tag} size={H.size} : ', end='')
    for i in range(1, H.size + 1):
        print(f'{H.data[i]}', end=' ')
    print()

#@s 检查是不是合法的堆：每个结点都要 <= 它的孩子
def CheckHeap(H):
    #@d C 的 i = 1; i * 2 <= H->size; i++ 就是 Python 的 range(1, H.size // 2 + 1)：
    #@d i * 2 <= size 和 i <= size // 2 是一回事，所以上界这么写没错。
    for i in range(1, H.size // 2 + 1):
        #@s 左孩子必须不小于自己
        if H.data[i] > H.data[i * 2]:
            print(f'  下标 {i} ({H.data[i]}) 大于它的左孩子 {H.data[i * 2]}')
            return 0
        #@s 如果有右孩子，也要检查
        if i * 2 + 1 <= H.size and H.data[i] > H.data[i * 2 + 1]:
            print(f'  下标 {i} ({H.data[i]}) 大于它的右孩子 {H.data[i * 2 + 1]}')
            return 0
    return 1
#%end

#%module | 09 | main | main —— 把堆跑一遍 | 2 | 01,02,03,04,05,06,07,08 |
#%summary | 建堆、插入、删除，每一步都打印出来看堆序是否保持。
#@d ============ 怎么自查堆对不对 ============
#@d
#@d 打印数组只能看到一堆数字，看不出堆序。两个办法：
#@d
#@d   ① 检查每个结点是否 <= 它的两个孩子（下面用 CheckHeap 做）
#@d   ② 看堆顶是不是最小值
#@d
#@d 注意**数组打印出来的顺序不代表任何大小关系** ——
#@d 堆只保证父子之间，兄弟之间是乱的。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 换成 if __name__ == '__main__':，意思一样：从这儿往下跑。
#@d   C 的 static const int a[] 到 Python 就是一个普通列表 [6, 3, 7, 1, 5, 2, 4]。
#@d   两个小坑：H->data[++H->size] 要拆成 H.size += 1 和 H.data[H.size] = a[i]；
#@d   C 的 i++ 同理，Python 的 for i in range(7) 自己就把 0..6 走了一遍。

#@s 主函数
if __name__ == '__main__':
    #@s 建一个堆
    H = CreateHeap(20)
    #@s 待建堆的数据
    a = [6, 3, 7, 1, 5, 2, 4]
    #@s 计数
    #@d C 这里是 int i; 一行，Python 不用声明，下面 for 自己造。

    #@s 把数据填进数组（注意从下标 1 开始）
    for i in range(7):
        H.size += 1
        H.data[H.size] = a[i]
    PrintHeap('原始数据:', H)
    print('（这时候还不是堆 —— 父子之间没有大小约束）\n')

    #@s 建堆
    BuildHeap(H)
    PrintHeap('建堆之后:', H)
    print(f'堆顶 = {H.data[1]}（一定是最小值）')
    print('检查堆序: ' + ('合法' if CheckHeap(H) else '不合法') + '\n')

    #@s 插入
    Insert(H, 0)
    PrintHeap('插入 0 后:', H)
    print(f'堆顶 = {H.data[1]}（0 一路浮到了顶上）')
    print('检查堆序: ' + ('合法' if CheckHeap(H) else '不合法') + '\n')

    #@s 连续删除最小值
    print('连续删除最小值: ', end='')
    for i in range(4):
        print(DeleteMin(H), end=' ')
    print()
    PrintHeap('删了 4 个之后:', H)
    print('检查堆序: ' + ('合法' if CheckHeap(H) else '不合法'))
    print('（每次删完，剩下的仍然是一个合法的堆）\n')

    #@s 逐个删空
    print('继续删到空: ', end='')
    while H.size > 0:
        print(DeleteMin(H), end=' ')
    print('\n（输出一定是从小到大 —— 这就是堆排序的雏形）')

    #@s 释放
    FreeHeap(H)
    #@s 正常结束
    #@d C 的 main 在这里 return 0;，Python 脚本跑到底就结束了，不用写这句。
#%end
