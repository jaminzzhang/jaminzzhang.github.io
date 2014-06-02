---
layout: post
title: 属性——《iOS 6编程实战》读书笔记(2)
---

###1、属性修饰关键字：

**原子性(atomic、nonatomic)**。atomic是在LLVm4中新加入的特性。atomic修饰关键字是表示使用self.调用的getter和setter方法是线程安全的。但不表示其他操作是线程安全。原子性同时使用锁来保证的，所以在属性不是经常被多线程改写的环境下不要使用atomic。

* **读写属性(readwrite、readonly)**。没有writeonly的修饰关键字
* **Setter修饰关键字(weak、unsafe_unretained、strong、copy)**：strong等同retain；weak类似assign，在iOS5以上的设备，加入了新的弱引用归零的特性，即当weak引用的对象被销毁后，weak引用会自动置为nil，防止野指针的出现。这一特性要求必须部署在不低于iOS 5.0版本的设备上。而assign（即unsafe_unretained）会继续指向被释放掉的内存，再次调用会引起crash。对于非可变类而有可变子类的属性（如NSString：子类NSMutableString可变，NSArray：子类NSMutableArray可变），应该使用copy修饰，这样可以防止属性被其他调用者改变。复制一个不可变的类通常是非常快的，只需要调用retain即可。


ARC出现以后，合成属性（synthesized property）的默认存储类型由assign改为了strong，即声明语句@property (noatomic) id aObj;之前等同于@property(nonatomic, assign) id aObj;现在等同于@property(nonatomic, strong) id aObj;


###2、私有实例变量
使用属性的的方式来声明成员是很好的方式，当然为了封装也可以使用实例变量。而声明私有实例变量可以通过以下的方法：（都是在.m文件）


```
@interface classname() {
    NSString * _name;
}

@end
```
或者

```
@implementation classname {
    NSString * _name;
}
```

跟其他变量一样，ARC也会自动对实例变量进行保留和释放。实例变量的默认存储类型是strong，但可以使用如下代码声明weak实例变量：

```
@implementation classname {
    __weak NSString * _name;
}
```

###3、存取器(Setter &amp; Getter)
应该使用存取器的原因：

* **KVO**。属性可被自动观察，加入不适用存取器，每次修改都需要调用willChangeValueForKey:和didChangeValueForKey:方法。而使用存取器，这两个方法自动调用。
* **副作用**。如Setter方法中可能加入了通知或事件，Getter方法中使用了缓存。而直接访问实例变量会直接忽视上述行为。
* **锁**。在多线程中存取器可能加入了锁，直接使用会导致没有锁的保护。
* **一致性**。在应该使用存取器的地方使用存取器，保证代码的一致性。Objective-C的存取器，尤其是自动合成的存取器，都是被高度优化过的，存取器所导致的开销是完全值得的，而且提高了系统的可维护性和灵活性。

**注意！下列情况不要使用存取器：**

* **存取器内部**。有可能会引起无限循环。
* **初始化方法**。因为这个时候对象可能处于不一致状态，这个期间通常不应该触发通知或者引入其他一些副作用。
* **dealloc方法**。因为这个时候对象也可能处于不一致状态。




{{ page.date | date_to_string}}
