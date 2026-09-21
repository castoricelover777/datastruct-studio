#%module | 01 | typedef | 头文件与 typedef | 1 |
#%summary | 公共定义：元素类型、交换、小数组的阈值 CUTOFF。
#@d ============ CUTOFF 是什么 ============
#@d
#@d 快排递归到"区间很短"的时候，再递归就不划算了 ——
#@d 因为：
#@d
#@d   · 短区间用插入排序本来就很快（近乎有序时接近 O(n)）
#@d   · 递归有函数调用的开销，短区间下这个开销占比反而大
#@d   · 短区间的主元选择也没什么意义
#@d
#@d 所以惯例是：**区间长度小于某个阈值就直接用插入排序**。
#@d
#@d 这个阈值通常取 5~20。这里取 CUTOFF = 3，方便在小数据上看出效果。
#@d
#@d 这也是快排比归并快的实际原因之一 —— 归并是老老实实递归到只剩一个元素。
#@d
#@d ============ 快排的稳定性 ============
#@d
#@d **快排不稳定。**
#@d
#@d 原因在划分那一步：元素会被swap到相隔很远的位置，
#@d 两个相等的元素很可能因此交换了相对顺序。
#@d
#@d 所以需要稳定排序时得用归并。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 用 typedef 给 int 起了个名字叫 ElementType，Python 没有 typedef，
#@d   直接写 ElementType = int 就行，就是个普通变量，留着是为了和 C 版对得上。
#@d
#@d   C 的 Swap 收的是两个指针，调用时写 Swap(&a, &b)。Python 没有指针，
#@d   也没有取地址符 &，所以改成把数组和两个下标一起传进去：Swap(A, i, j)。
#@d   列表是可变对象，函数里改完外面立刻就变了，不用靠指针把结果带回来。
#@d
#@d   C 的 #define CUTOFF 3 是编译前替换，Python 就是一句 CUTOFF = 3，
#@d   用起来一模一样。C 里 int i, j; 那种提前声明 Python 不需要，只剩注释。

#@s 元素类型
ElementType = int

#@s 状态码
OK = 1
ERROR = 0
#@d C 的 typedef int Status; 是给返回类型起个别名，Python 不看类型，
#@d 这里照样留一个 Status = int，为的是和 C 版一行行对得上。
Status = int

#@s 小数组的阈值：区间比它短就改用插入排序
CUTOFF = 3

#@s 交换两个元素
#@d C 的参数是指针 —— C 是值传递，传值改的是副本，传指针才能改到外面。
def Swap(A, i, j):
    #@s 临时变量倒手
    t = A[i]
    A[i] = A[j]
    A[j] = t
    #@d Python 其实可以一行写完：A[i], A[j] = A[j], A[i]。
    #@d 这里故意不这么写 —— 这一节讲的是划分过程，要让你看清
    #@d "交换一次 = 倒手三次"，写成一行就把过程藏起来了。

#@s 插入排序（给快排处理小数组用）
#@d 和 05-01 的写法完全一样，只是范围变成了 A[0..N-1]。
def InsertionSort(A, N):
    #@s 循环用
    for i in range(1, N):
        #@s 暂存当前元素
        tmp = A[i]

        #@s 内层：从 i 往左找位置
        #@d C 的内层 for 是 for (j = i; j > 0 && A[j-1] > tmp; j--)，
        #@d 中间那个条件带着数组比较，Python 的 for 塞不进去，所以改成 while。
        j = i
        while j > 0 and A[j - 1] > tmp:
            #@s 后移一格 —— 只有 1 次赋值，比交换省
            A[j] = A[j - 1]
            #@d C 的 j-- 写在 for 的第三段里自动走，Python 的 while 得自己减。
            j -= 1

        #@s 落位
        A[j] = tmp
#%end

#%module | 02 | Median3 | Median3 —— 三数取中选主元 | 2 | 01 |
#%summary | 从最左、中间、最右三个里取中间大小的当主元。
#@d ============ 为什么不能随便选主元 ============
#@d
#@d 最省事的选法当然是"每次都取第一个元素"。但这样有个致命问题：
#@d
#@d   **如果数组本来就已经有序**（{1,2,3,4,5}），那第一个元素就是最小值，
#@d   划分之后左边 0 个、右边 4 个，递归变成 n 层 → **O(n²)**
#@d
#@d 而"近乎有序"实在太常见了：日志按时间追加、数据库里的自增主键、
#@d 从文件读进来的已经大致排好的数据……
#@d
#@d ============ 三数取中 ============
#@d
#@d 取最左、中间、最右三个元素，把它们**排一下序**，然后选中间那个当主元。
#@d
#@d 还是 {1,2,3,4,5}，取 A[0]=1、A[2]=3、A[4]=5：
#@d
#@d   排一下还是 1,3,5，中间的是 3
#@d
#@d 用 3 当主元就比 1 好得多 —— 至少不会把全部元素都推到一边。
#@d
#@d ============ 附带的好处：顺手把边界排好了 ============
#@d
#@d 三数取中做完之后，我们知道了三件事：
#@d
#@d   A[Left]  <= A[Center] <= A[Right]
#@d
#@d 于是：
#@d
#@d   · A[Left] 一定不大于主元 → 它是个天然的"左哨兵"
#@d   · A[Right] 一定不小于主元 → 它是个天然的"右哨兵"
#@d
#@d 这是**极其有用的副产品**：下一个模块的划分循环里，
#@d `while (A[++i] < Pivot)` 不用再写 `i <= Right` 的边界检查 ——
#@d 因为 A[Left] 和 A[Right] 一定会把循环挡住。
#@d
#@d ============ 主元藏到哪里 ============
#@d
#@d 标准做法是把主元换到 **A[Right - 1]**：
#@d
#@d   · A[Right] 要留着当右哨兵，不能占用
#@d   · 主元放在最右边那一格附近，划分时正好两边都够用
#@d
#@d 所以划分的范围是 A[Left+1] 到 A[Right-2]，主元就摆在 A[Right-1] 上。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int Center = (Left + Right) / 2; 是整数除法，小数直接丢掉；
#@d   Python 的 / 会算成 3.5 这种小数，拿去做下标当场报错，
#@d   所以必须写 //（整除）。这里的下标都不是负数，两种除法结果一样。
#@d
#@d   C 里换元素写 Swap(&A[Left], &A[Center])，要加 & 取地址；
#@d   Python 没有取地址符，直接 Swap(A, Left, Center)，把下标告诉函数就行。
#@d
#@d   三个 if 加上大括号在 C 里是 9 行，Python 靠冒号加缩进，一个 if 两行。
#@d   判断条件和执行的动作一字没改，只是少了括号。

#@s 取 A[Left]、A[Center]、A[Right] 的中位数作为主元
#@d 顺便把它们三个排好序，并把主元换到 A[Right-1] 上
def Median3(A, Left, Right):
    #@s 中间位置
    #@d C 的 / 对整数是"丢掉小数"，Python 的 // 是"往下取整"，
    #@d 这里下标都是正的，所以两个写法得数一样。
    Center = (Left + Right) // 2

    #@s 第一步：让 A[Left] <= A[Center]
    if A[Left] > A[Center]:
        Swap(A, Left, Center)

    #@s 第二步：让 A[Left] <= A[Right]
    if A[Left] > A[Right]:
        Swap(A, Left, Right)

    #@s 第三步：让 A[Center] <= A[Right]
    #@d 三步做完，三个数就排好了：A[Left] <= A[Center] <= A[Right]
    if A[Center] > A[Right]:
        Swap(A, Center, Right)

    #@s 把主元（Center 位置上的那个）换到 A[Right - 1]
    #@d 为什么是 Right-1？因为 A[Right] 要留着当右哨兵，
    #@d 而 Right-1 这个位置在划分时正好不会被用到。
    Swap(A, Center, Right - 1)

    #@s 返回主元的值
    return A[Right - 1]
#%end

#%module | 03 | Partition | Partition —— 划分 | 3 | 01,02 |
#%summary | 两个指针从两头往中间夹，把小的换到左边、大的换到右边。
#@d ============ 划分在做什么 ============
#@d
#@d 目标：把数组重新排列成
#@d
#@d    [ 比主元小的 ]  主元  [ 比主元大的 ]
#@d
#@d 做法是**两头夹逼**：
#@d
#@d   i 从左往右走，遇到 >= 主元的就停下
#@d   j 从右往左走，遇到 <= 主元的就停下
#@d   两个都停下了 → 交换 A[i] 和 A[j]，继续
#@d   i 和 j 错开了 → 划分结束
#@d
#@d 走一遍（主元是 5，已换到 A[Right-1]）：
#@d
#@d   下标  0   1   2   3   4   5   6
#@d   值    3   1   4   5   8   9   6
#@d         ↑L          ↑P      ↑R
#@d
#@d   i 从 1 开始右移：1 < 5 继续、4 < 5 继续、碰到主元 5 停下 → i 停在 3
#@d   j 从 5 开始左移：9 > 5 继续、8 > 5 继续、碰到 4 < 5 停下 → j 停在 2
#@d
#@d   现在 i=3 > j=2，已经错开 → 不交换，划分结束
#@d
#@d 最后把主元换到 A[i] 的位置，主元就永久到位了。
#@d
#@d ============ 为什么不需要写边界检查 ============
#@d
#@d 这是三数取中送的礼物。回想 Median3 做完之后我们知道：
#@d
#@d   A[Left]  <= 主元  →  i 往右走一定会在 A[Left] 处停下
#@d   A[Right] >= 主元  →  j 往左走一定会在 A[Right] 处停下
#@d
#@d 所以两个 while 循环**一定不会越界**，不用写 `i <= Right` 这种检查。
#@d
#@d 这是一个很典型的"用数据本身当哨兵"的技巧：
#@d 与其在循环里反复判断边界，不如事先保证"一定会被挡住"。
#@d 03-04 讲堆的时候，哨兵 MINDATA 也是同样的思路。
#@d
#@d ============ 为什么写成 while (A[++i] < Pivot) 这种形式 ============
#@d
#@d 注意是先 ++i 再比较，而不是先比较再 ++i。
#@d
#@d 这个顺序保证了：**遇到等于主元的元素时会停下并交换**。
#@d
#@d 如果写成 `while (A[i] < Pivot) i++;`（先比后加），遇到等于主元的元素
#@d 会一直往前走，那遇到"全是相同元素"的数组就会退化成 O(n²)。
#@d
#@d 这是个很细但很重要的点：**处理大量重复元素时，让等于主元的也参与交换，
#@d 反而能把数组切成均匀的两半。**
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 while (A[++i] < Pivot) 一句话里既加了 i 又比了值，
#@d   Python 没有 ++i 这种写法，只能拆成两句：先 i += 1，再拿新位置去比。
#@d   拆开以后反而更容易看出"先加后比"这个关键点 —— 少写一次就退化成 O(n²)。
#@d
#@d   C 用 for (;;) 表示死循环（三段全空），Python 写成 while True，意思一样，
#@d   跳出去还是靠 break，和 C 分毫不差。
#@d
#@d   空循环体也不一样：C 写一对空的大括号 { }，Python 里什么都不用写，
#@d   只要循环体是空的就不占行，所以那两个 while 后面直接跟下一句。

#@s 划分：返回主元最终所在的位置
#@d 调用前要保证 A[Left] <= Pivot <= A[Right]（Median3 已经保证了）
def Partition(A, Left, Right, Pivot):
    #@s 左指针：从 Left+1 开始（A[Left] 是左哨兵，不用动）
    i = Left
    #@s 右指针：从 Right-1 开始（主元就在那儿，也不动）
    j = Right - 1

    #@s 两头往中间夹
    #@d C 的 for (;;) 在这儿就是 while True，死循环，靠里面的 break 出来。
    while True:
        #@s 从左往右找第一个 >= 主元的
        #@d 空循环体是刻意的：先 ++i 再看值，遇到 >= 主元的就停在这里。
        #@d C 把"加一"写在条件里（++i），Python 没有这个运算符，
        #@d 所以先单独写一行 i += 1，再让 while 拿新位置的值去比。
        i += 1
        while A[i] < Pivot:
            i += 1

        #@s 从右往左找第一个 <= 主元的
        #@d 同样地，C 的 --j 是先减再比，Python 先写 j -= 1 再进 while。
        j -= 1
        while A[j] > Pivot:
            j -= 1

        #@s 两个指针错开了 → 划分结束
        if i >= j:
            break

        #@s 否则交换这两个"站错队"的元素
        Swap(A, i, j)

    #@s 把主元换到 i 的位置 —— 从此它永远到位
    #@d 主元之前一直存在 A[Right-1]，现在把它放到正确的位置上。
    Swap(A, i, Right - 1)

    #@s 返回主元的位置
    return i
#%end

#%module | 04 | QSort | QSort —— 递归处理两半 | 3 | 01,02,03 |
#%summary | 划分完之后，主元两边各自递归 —— 主元本身不用再管。
#@d ============ 递归的结构 ============
#@d
#@d   ① 区间太短 → 改用插入排序，返回
#@d   ② 选主元（Median3）
#@d   ③ 划分（Partition），拿到主元位置 i
#@d   ④ 递归处理 [Left, i-1]
#@d   ⑤ 递归处理 [i+1, Right]
#@d
#@d 注意第 ④⑤ 步都**跳过了 i** —— 因为划分完主元就已经在最终位置上了，
#@d 再把它放进任何一边都是多余的。
#@d
#@d 这一点和归并不同：归并每次都要"合并"整个区间，
#@d 而快排的划分动作本身就完成了排序的一部分，所以不需要"合"。
#@d
#@d ============ 为什么快排平均比归并快 ============
#@d
#@d 虽然两者平均都是 O(n log n)，但快排的常数因子更小：
#@d
#@d   · **原地排序**，不需要 O(n) 的临时数组
#@d   · 划分是顺序扫描，对 CPU 缓存友好（而归并要来回拷数据）
#@d   · 小数组直接上插入排序，省掉大量递归
#@d
#@d 所以标准库的 qsort、C++ 的 std::sort（内省排序）都以快排为骨架。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 里函数开头要写 ElementType Pivot; int i; 先把变量声明出来，
#@d   Python 不用声明，第一次赋值的时候变量就冒出来了，所以那两行只剩注释。
#@d
#@d   C 给 InsertionSort 传的是 A + Left —— 让指针往后挪 Left 格，指到这一小段
#@d   的开头。Python 的列表不能这么加，得先把这一段切出来：
#@d   切片 A[Left:Right + 1] 是复制一份新的，排完还得用 A[Left:Right + 1] = seg
#@d   塞回原数组，不然排的是那份复制品，原数组一点没变。
#@d
#@d   递归就是原样照写：QSort 里调 QSort，和 C 一模一样。
#@d   只是 Python 默认只让递归 1000 层，数据特别大的时候得自己把上限调高，
#@d   这一节最多十个数，远远够用。

#@s 对 A[Left..Right] 做快速排序
def QSort(A, Left, Right):
    #@s 主元
    #@s 主元最终位置
    #@d C 里这两行是 ElementType Pivot; 和 int i; 的声明，
    #@d Python 不用提前声明变量，所以这里只留下说明。

    #@s ① 区间足够长才用快排
    if Right - Left >= CUTOFF:
        #@s ② 选主元，顺便把边界排好
        Pivot = Median3(A, Left, Right)

        #@s ③ 划分，拿到主元的位置
        i = Partition(A, Left, Right, Pivot)

        #@s ④ 左半边（不含主元）
        QSort(A, Left, i - 1)

        #@s ⑤ 右半边（不含主元）
        QSort(A, i + 1, Right)
    #@s 区间太短 → 插入排序收尾
    #@d 这就是 CUTOFF 的用处：短区间递归不划算。
    else:
        #@d C 写的是 InsertionSort(A + Left, Right - Left + 1)，
        #@d A + Left 是指针往后挪，指到子数组的开头。
        #@d Python 没有这种指针算术，所以切成一段 seg 排好再塞回去 ——
        #@d seg 是复制出来的，忘了塞回去就等于什么都没干。
        seg = A[Left:Right + 1]
        InsertionSort(seg, Right - Left + 1)
        A[Left:Right + 1] = seg
#%end

#%module | 05 | QuickSort | QuickSort —— 对外接口 | 1 | 01,04 |
#%summary | 一行调用，顺手处理空数组。
#@d ============ 为什么还要包一层 ============
#@d
#@d 因为 QSort 需要 Left 和 Right 两个参数，而使用者只想传"数组 + 长度"。
#@d
#@d 另外还要处理边界：**长度为 0 或 1 时直接返回**。
#@d
#@d 别小看这一句。N = 0 时 Right = -1，Median3 里算 Center 就会得到负数下标 ——
#@d 直接越界访问。这种边界 bug 平时跑不到，一旦遇到就是随机崩溃。
#@d
#@d 这是所有排序算法接口都应该做的事：**先挡住退化输入**。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 void QuickSort(ElementType A[], int N) 里那个 A[] 其实是个指针，
#@d   Python 传的就是列表本身，函数里改了 A[i]，外面那个列表跟着一起变。
#@d
#@d   C 提前返回写 return;，Python 写 return，后面什么都不跟，意思一样。
#@d
#@d   长度还是老实传一个 N 进来，和 C 版对得上。
#@d   其实 Python 的列表自己知道长度（len(A)），这里不用是为了两边好对照。

#%summary | 对外的接口：传数组和长度就行。
def QuickSort(A, N):
    #@s 空数组或只有一个元素，天然有序
    if N < 2:
        return

    #@s 调用递归主体
    QSort(A, 0, N - 1)
#%end

#%module | 06 | PrintArray | PrintArray —— 打印与检查 | 1 | 01 |
#%summary | 打印数组、检查是否有序。
#@d 和 05-02 一样的两件自查工具。
#@d 排序算法的 bug 常常只在特定排列下暴露，所以每次改完都要验一遍。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 printf 打完不换行，Python 的 print 每打一次自己补一个换行，
#@d   所以不想换行的地方统统要加 end=''（打完什么都不接）。
#@d   刚到 Python 的人十有八九会忘，然后输出变成一列。
#@d
#@d   C 的 printf("%d", A[i]) 是把整数按十进制打出来，没有多余空格；
#@d   Python 写 print(A[i], end='') 效果一模一样，连最后一个数后面的
#@d   那点分隔也全靠 if 控制，两边打出来的字一模一样。
#@d
#@d   C 的 IsSorted 返回 int，0 表示乱、1 表示有序；Python 里更常见的是
#@d   返回 True / False，这里特意留着 0 和 1，为的是和 C 版对得上。

#@s 打印数组
def PrintArray(A, N):
    #@s 循环用
    print('[', end='')
    for i in range(N):
        print(A[i], end='')
        if i < N - 1:
            print(', ', end='')
    print(']', end='')

#@s 检查是否有序
def IsSorted(A, N):
    #@s 循环用
    #@d C 的条件是 i + 1 < N，Python 写成 range(N - 1)，
    #@d i 一样是从 0 走到 N-2，最后那次比较 A[N-2] 和 A[N-1] 一次不落。
    for i in range(N - 1):
        if A[i] > A[i + 1]:
            return 0
    return 1
#%end

#%module | 07 | main | main —— 快排跑一遍，再看最坏情况 | 3 | 01,02,03,04,05,06 |
#%summary | 普通数据、已有序数据、大量重复元素 —— 三种情况都试。
#@d ============ 为什么要试三种数据 ============
#@d
#@d   **随机数据**：快排的常态，平均 O(n log n)
#@d   **已经有序**：如果主元选得差就会退化 —— 用它验证三数取中确实有用
#@d   **大量重复**：这是划分写法的一个考验（`++i` 的位置很关键）
#@d
#@d 只测随机数据的话，这三种坑一个都发现不了。
#@d
#@d ============ 这段 Python 和 C 有什么不一样 ============
#@d
#@d   C 的 int main(void) 是程序运行时自己去调的入口，Python 没有这回事，
#@d   惯例写成 if __name__ == '__main__':，
#@d   意思是"直接运行这个文件才执行，被别的文件 import 进来时不执行"。
#@d
#@d   C 的 ElementType a1[] = { 5, 1, 4, ... }; 是先开数组再填数，
#@d   Python 直接 a1 = [5, 1, 4, ...] 一行就完事，长度也不用另说。
#@d
#@d   C 的 printf("...%d...\n", x) 在这儿写成 f'...{x}...'（字符串前面带 f，
#@d   花括号里直接填变量或者式子），打出来的字一模一样。
#@d
#@d   C 最后要 return 0; 告诉系统"正常结束"；Python 脚本跑到最后一行就自己
#@d   结束了，所以那一句没有了。

#@s 主函数
if __name__ == '__main__':
    #@s 随机数据
    a1 = [5, 1, 4, 2, 8, 3, 9, 0, 7, 6]
    #@s 已经有序
    a2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    #@s 大量重复
    a3 = [3, 3, 1, 3, 2, 3, 1, 2, 3, 3]
    #@s 长度
    n = 10
    #@s 循环用
    #@d C 里这句是 int i; 的声明，下面的代码其实没用上 i（数组是直接初始化
    #@d 好的，没有循环去拷），所以 Python 这边只留下这行注释。

    #@s ===== 随机数据 =====
    print('=== 随机数据 ===')
    print('原始: ', end='')
    PrintArray(a1, n)
    print()
    QuickSort(a1, n)
    print('排后: ', end='')
    PrintArray(a1, n)
    #@d C 是 printf("  %s\n\n", ...)，末尾两个换行；
    #@d Python 的 print 自己带一个，所以字符串里补一个 '\n' 正好凑够两个。
    print('  ' + ('有序 ✓' if IsSorted(a1, n) else '还是乱的 ✗') + '\n')

    #@s ===== 已经有序 =====
    print('=== 已经有序的数据 ===')
    print('原始: ', end='')
    PrintArray(a2, n)
    print()
    QuickSort(a2, n)
    print('排后: ', end='')
    PrintArray(a2, n)
    print('  ' + ('有序 ✓' if IsSorted(a2, n) else '还是乱的 ✗'))
    print('（如果主元每次都取第一个元素，这种输入会退化到 O(n^2)）')
    print('（三数取中就是为了避免这种情况）\n')

    #@s ===== 大量重复 =====
    print('=== 大量重复元素 ===')
    print('原始: ', end='')
    PrintArray(a3, n)
    print()
    QuickSort(a3, n)
    print('排后: ', end='')
    PrintArray(a3, n)
    print('  ' + ('有序 ✓' if IsSorted(a3, n) else '还是乱的 ✗'))
    print('（划分时的 `while (A[++i] < Pivot)` 在这里很关键：')
    print('  先加后比，遇到等于主元的会停下并交换，把重复元素均匀分到两边）\n')

    #@s 演示划分的效果
    #@d C 这里特意套了一层 { }，是为了让 b、m、pivot、pos 只在这段里有效。
    #@d Python 没有这种花括号作用域，变量写在哪就是整个脚本的，
    #@d 所以那一对括号没有了，代码直接接着往下写。
    b = [3, 1, 4, 5, 8, 9, 6]
    m = 7

    print('=== 看一次划分 ===')
    print('划分前: ', end='')
    PrintArray(b, m)
    print()

    pivot = Median3(b, 0, m - 1)
    print(f'三数取中选出的主元 = {pivot}')

    pos = Partition(b, 0, m - 1, pivot)

    print('划分后: ', end='')
    PrintArray(b, m)
    print()
    print(f'主元 {b[pos]} 落在了下标 {pos} —— 它已经**永久到位**')
    print('左边都比它小，右边都比它大，接下来只要递归处理两边')

    #@s 总结
    print('\n=== 快排的三个要点 ===')
    print('  ① 选主元用三数取中，避免有序数据退化')
    print('  ② 划分用两头夹逼，靠 A[Left]/A[Right] 当哨兵，不写边界检查')
    print('  ③ 短区间（< CUTOFF）改用插入排序，省掉递归开销')
    print('\n快排不稳定 —— 划分时的交换会跨越很远，打乱相同元素的相对顺序')

    #@s 正常结束
    #@d C 里最后是 return 0;（表示正常退出），Python 没有这一步，
    #@d 脚本走到最后一行就自己结束了。真要表示"出错退出"才需要 sys.exit(1)。
#%end
