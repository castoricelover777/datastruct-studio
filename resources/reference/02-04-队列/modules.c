/*
 * ============================================================================
 *  数据结构研习社 —— 02 线性结构 / 02-04 队列
 * ============================================================================
 *
 *  队列：只允许一端进、另一端出的线性表。**先进先出（FIFO）**。
 *
 *  如果照搬顺序表的写法，队列很快会撞上一个尴尬：元素一直出队，
 *  front 一直往后走，前面的格子空着却再也用不上 —— 这叫**假溢出**。
 *
 *  解决办法很漂亮：把数组首尾接成一个环。这一节的重点全在这个"环"上。
 *
 *  标记约定同前（本文件本身可编译）。
 * ============================================================================
 */

#include <stdio.h>

//%module | 01 | typedef | 头文件与 typedef | 1 |
//%summary | front 指队头、rear 指队尾的下一个位置，数组首尾相连成环。
//@d ============ 先看不用环会怎样（假溢出） ============
//@d
//@d 假设数组长度 5，一直"入队—出队"：
//@d
//@d   出队 3 次之后：
//@d        ┌────┬────┬────┬────┬────┐
//@d        │ __ │ __ │ __ │ 40 │ 50 │      front = 3, rear = 5
//@d        └────┴────┴────┴────┴────┘
//@d          ↑ 空着三个格子，但 rear 已经到头了
//@d
//@d 明明还有空间，却再也放不进新元素 —— 这就是**假溢出**。
//@d 真溢出是"数组真满了"，假溢出是"rear 撞墙了但前面空着"。
//@d
//@d ============ 用环解决 ============
//@d
//@d 让下标走到末尾之后回到 0：`(rear + 1) % MAXSIZE`
//@d
//@d        ┌────┬────┬────┬────┬────┐
//@d        │ 60 │ 70 │ __ │ 40 │ 50 │
//@d        └────┴────┴────┴────┴────┘
//@d                 ↑         ↑
//@d              rear = 2   front = 3
//@d
//@d 逻辑上是这样一圈（下标 0 紧接在 4 后面）：
//@d
//@d              0 ── 1 ── 2
//@d              │         │
//@d              4 ── 3 ───┘
//@d
//@d ============ 约定（务必记牢） ============
//@d
//@d   front 指向**队头元素本身**
//@d   rear  指向**队尾元素的下一个位置**（也就是下次入队该放哪）
//@d
//@d   front == rear                    →  队空
//@d   (rear + 1) % MAXSIZE == front    →  队满
//@d
//@d 注意队满的写法：它故意"浪费一个格子"，让队满和队空能区分开。
//@d 否则 front == rear 既可能是空也可能是满 —— 那就没法判断了。

//@s 元素类型
typedef int ElemType;

//@s 队列容量：实际最多只能放 MAXSIZE-1 个元素（为了区分空和满）
#define MAXSIZE 10

//@s 状态码
#define OK 1
#define ERROR 0

//@s 返回值类型
typedef int Status;

//@s 循环队列
typedef struct
{
//@s 连续内存，当成环来用
    ElemType data[MAXSIZE];
//@s 队头元素的下标
    int front;
//@s 队尾元素的下一个位置
    int rear;
} Queue;
//%end

//%module | 02 | InitQueue | InitQueue —— 初始化 | 1 | 01 |
//%summary | front = rear = 0 —— 空队的标志就是两个指针重合。
//@d ============ 为什么空队是 front == rear ============
//@d
//@d 因为 rear 约定指向"队尾的下一个位置"。队里一个元素都没有时，
//@d 队头在 0，下一个可放的位置也是 0 —— 两个指针自然重合。
//@d
//@d 初始值取 0 而不是 -1，和栈不太一样。栈用 -1 是因为要让 top 指着一个
//@d 真实格子；队列这里两个指针都表示"位置"，从 0 起更顺。
//@d
//@d 从 0 起还有个好处：求元素个数时不用再加偏移，
//@d 直接用 (rear - front + MAXSIZE) % MAXSIZE 就够了。

//@s 传指针：两个指针都要改
Status InitQueue(Queue *Q)
{
//@s 队头归零
    Q->front = 0;
//@s 队尾归零 —— 与 front 重合即队空
    Q->rear = 0;
//@s 成功
    return OK;
}
//%end

//%module | 03 | EnQueue | EnQueue —— 入队 | 2 | 01,02 |
//%summary | 先判满，把元素放到 rear 处，再让 rear 绕环前进一格。
//@d ============ 入队 ============
//@d
//@d   入队前： 10  20  __  __  __      front = 0, rear = 2
//@d             0   1   2   3   4
//@d
//@d   ① data[rear] = 30   →  放进 2 号位
//@d   ② rear = (2+1) % 5 = 3
//@d
//@d   入队后： 10  20  30  __  __      front = 0, rear = 3
//@d
//@d 元素放在 rear 处而不是 rear+1 处 —— 因为 rear 自己就指着"下一个空位"。
//@d 这一点和栈的"先 top++ 再放"刚好相反，是两个最容易记混的地方：
//@d
//@d   栈  ：先动指针，再放数据（top 指栈顶元素）
//@d   队列：先放数据，再动指针（rear 指下一个空位）
//@d
//@d ============ 判满为什么是 (rear+1)%MAXSIZE == front ============
//@d
//@d 假如队里已满（真的把 MAXSIZE 个格子都用了），那么 rear 绕一圈后
//@d 会和 front 重合 —— 这时 front == rear，和"队空"撞车了。
//@d
//@d 所以干脆**主动牺牲一个格子**：当 rear 的下一格就是 front 时，就认定满了。
//@d 队列显示只能装 MAXSIZE-1 个元素，换来的是空/满一眼可辨。
//@d
//@d 代价就是一个格子的空间，非常划算。

//@s 入队
Status EnQueue(Queue *Q, ElemType e)
{
//@s 先判满 —— 注意是"下一格是否会撞上 front"
    if ((Q->rear + 1) % MAXSIZE == Q->front)
    {
//@s 满了就拒绝
        return ERROR;
    }

//@s 放入 rear 所指的空位
    Q->data[Q->rear] = e;

//@s rear 绕环前进一格（到头了就回到 0）
//@d 这个 % MAXSIZE 就是"环"的全部实现。没有它，rear 会一直涨下去，
//@d 很快越界 —— 而不取模导致的 bug 往往要到队列跑很多轮之后才暴露。
    Q->rear = (Q->rear + 1) % MAXSIZE;

//@s 成功
    return OK;
}
//%end

//%module | 04 | DeQueue | DeQueue —— 出队 | 2 | 01,02 |
//%summary | 先判空，取走 data[front]，再让 front 绕环前进一格。
//@d ============ 出队 ============
//@d
//@d   出队前： 10  20  30  __  __      front = 0, rear = 3
//@d
//@d   ① e = data[0] = 10
//@d   ② front = (0+1) % 5 = 1
//@d
//@d   出队后： 10  20  30  __  __      front = 1, rear = 3
//@d             ↑
//@d        10 还在数组里，但已经不属于这张队列
//@d
//@d 和栈一样：**出队不擦数据，只是把 front 往前挪**。
//@d 空出来的格子不会被浪费 —— 等 rear 绕回来时会重新用它，
//@d 这正是循环队列比普通顺序队列强的地方。
//@d
//@d ============ 队空判断 ============
//@d front == rear 就是空。出队前必须判，否则读到的是早就出队的数据，
//@d 或者干脆是没初始化过的垃圾值。

//@s 出队，元素由 e 带回
Status DeQueue(Queue *Q, ElemType *e)
{
//@s 先判空
    if (Q->front == Q->rear)
    {
        return ERROR;
    }

//@s 取走队头元素
    *e = Q->data[Q->front];

//@s front 绕环前进一格
    Q->front = (Q->front + 1) % MAXSIZE;

//@s 成功
    return OK;
}
//%end

//%module | 05 | main | main —— 把循环队列跑一遍 | 1 | 01,02,03,04 |
//%summary | 用"边进边出"跑够 100 次，看它会不会假溢出。
//@d ============ 这一节最该亲眼看到的一幕 ============
//@d
//@d 普通顺序队列只要出队几次，rear 就到头了，明明前面空着却放不进去。
//@d 循环队列跑下面这段"入队一个再出队一个"的循环 100 次，
//@d 每次都有位置 —— rear 和 front 会一起绕圈，永远不会撞墙。
//@d
//@d 打印出 front 和 rear 的变化过程，你会看到它们一次次从末尾跳回 0。

//@s 打印队列内容（从 front 开始，按逻辑顺序）
//@d 注意不能简单地 for (i = 0; i < MAXSIZE; i++)：
//@d 环里的元素可能"绕过弯"，必须从 front 出发绕圈走。
static void PrintQueue(const char *tag, Queue Q)
{
    int i;
    int n = (Q.rear - Q.front + MAXSIZE) % MAXSIZE;   /* 元素个数 */

    printf("%s front=%d rear=%d 共%d个 : ", tag, Q.front, Q.rear, n);
    for (i = 0; i < n; i++)
    {
        printf("%d ", Q.data[(Q.front + i) % MAXSIZE]);
    }
    printf("\n");
}

//@s 主函数
int main(void)
{
//@s 定义队列
    Queue Q;
//@s 出口参数
    ElemType e;
//@s 循环用
    int i;

//@s 初始化
    InitQueue(&Q);
    PrintQueue("初始化后:", Q);

//@s 入队 10 20 30
    EnQueue(&Q, 10);
    EnQueue(&Q, 20);
    EnQueue(&Q, 30);
    PrintQueue("入队 10 20 30 后:", Q);

//@s 出队一个 —— 应该是最先进入的 10
    if (DeQueue(&Q, &e) == OK)
    {
        printf("出队一个 -> %d（最先进去的最先出来）\n", e);
    }
    PrintQueue("出队后:", Q);

//@s 反复入队到满，看看到底能装几个
//@d 把 MAXSIZE 个全塞进去是不行的 —— 会留一个空位用来区分空和满。
    i = 0;
    while (EnQueue(&Q, 100 + i) == OK)
    {
        i++;
    }
    printf("最多装下 %d 个（MAXSIZE=%d，故意留一格）\n", i, MAXSIZE);
    PrintQueue("装满后:", Q);

//@s 关键一幕：边进边出跑很多次，验证不会假溢出
//@d 普通顺序队列跑到这里早就"溢"了，循环队列能一直跑下去。
    for (i = 0; i < 100; i++)
    {
        DeQueue(&Q, &e);
        EnQueue(&Q, i);
    }
    printf("边进边出 100 次之后：\n");
    PrintQueue("  当前状态:", Q);
    printf("  front 和 rear 都绕回小下标了 —— 这就是环的功劳\n");

//@s 正常结束
    return 0;
}
//%end
