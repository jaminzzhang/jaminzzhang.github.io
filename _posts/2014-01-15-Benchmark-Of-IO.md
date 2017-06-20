---
layout: post
title: iOS文件操作(IO)的Benchmark
---

一直想看看iOS的IO性能到底怎么样，所以就有了这次的文件操作的benchmark，让我们看看各种文件操作的效率。  
测试工具：Xcode 5.0.2 (5A3005) XCTest  
测试设备：iPod 5 32G  
测试代码：https://github.com/jaminzzhang/FileManagerBenchmark.git
  
  
&nbsp;

## 1、读取文件信息

#### 1）检查文件是否存在
API:
<div>
<pre><code>- (BOOL)fileExistsAtPath:(NSString *)path;
- (BOOL)fileExistsAtPath:(NSString *)path isDirectory:(BOOL *)isDirectory;</code></pre>
</div>
Benchmark结果：  
目标路径文件存在  
SEL(fileExistsAtPath:)                次数：10000次(1W次)         耗时：2.880s ~ 2.890s  
SEL(fileExistsAtPath:isDirectory:)    次数：10000次(1W次)         耗时：2.890s ~ 2.900s

目标路径文件不存在   
次数：10000次       耗时：0.500 ~ 0.510s

从结果可以看到，检查的目标路径的文件存在耗时为0.2880ms，0.2880ms是什么概念？就是相当于NSArray使用快速遍历(NSFastEnumeration)1000个左右元素。而加入isDirectory是否目录的判断对效率的影响微乎极微。但需要注意的是，假如目标路径的文件不存在，耗时则非常少，即判断一个不存在的文件是否存在的耗时非常之少，所以，估计当判断到文件存在之后，还读取了文件一系列信息，包括是否是路径，是否是软链接等。

*ps：假如目标路径的文件是软链接文件，fileExistsAtPath会源溯到该软链接文件的目标路径来检查文件是否存在(If the final element in path specifies a symbolic link, this method traverses the link and returns YES or NO based on the existence of the file at the link destination.)。因此检查软链文件是否存在的时候需要特别注意，如检查到软链文件对应的目标路径文件不存在（实际软链还存在），此时再去创建一个软链文件的话会报错，说软链文件已存在。*

#### 2）获取文件信息
API
<div>
<pre><code>- (NSDictionary *)attributesOfItemAtPath:(NSString *)path error:(NSError **)error</code></pre>
</div>

Benchmark结果：  
文件        次数：10000次(1W次)        耗时：11.800s ~ 11.900s  
文件夹    次数：10000次(1W次)          耗时：5.700s ~ 5.800s


#### 3）遍历文件
API
<div>
<pre><code>
- (NSArray *)subpathsOfDirectoryAtPath:(NSString *)path error:(NSError **)error (- (NSArray *)subpathsAtPath:(NSString *)path)
- (NSArray *)contentsOfDirectoryAtPath:(NSString *)path error:(NSError **)error (- (NSArray *)directoryContentsAtPath:(NSString *)path)
- (NSDirectoryEnumerator *)enumeratorAtPath:(NSString *)path;
- (NSDirectoryEnumerator *)enumeratorAtURL:(NSURL *)url includingPropertiesForKeys:(NSArray *)keys options:(NSDirectoryEnumerationOptions)mask errorHandler:(BOOL (^)(NSURL *url, NSError *error))handler</code></pre>
</div>
&nbsp;
Benchmark结果：

1级目录(10000个文件)：
SEL(contentsOfDirectoryAtPath:error:)                                                                      文件数：10000                耗时：0.070s ~ 0.080s  
SEL(subpathsOfDirectoryAtPath:error:)                                                                     文件数：10000                耗时：0.230s ~ 0.240s  
SEL(enumeratorAtPath:)                                                                                            文件数：10000                耗时：5.000s ~ 5.200s  
SEL(enumeratorAtURL:includingPropertiesForKeys:options:errorHandler:)             文件数：10000次             耗时：0.410s ~ 0.420s  
  
2级目录(两个层级，每个层级10000个文件，共两万个文件)：  
SEL(contentsOfDirectoryAtPath:error:)                                                                      文件数：10000                 耗时：0.070s ~   0.080s SEL(subpathsOfDirectoryAtPath:error:)                                                                     文件数：20000                 耗时：0.460s ~ 0.470s  
SEL(enumeratorAtPath:)                                                                                            文件数：20000                 耗时：10.310s ~ 10.320s  
SEL(enumeratorAtURL:includingPropertiesForKeys:options:errorHandler:)             文件数：20000次              耗时：0.790s ~ 0.800s  


上述几个遍历的方法，除了SEL(contentsOfDirectoryAtPath:error:)是浅遍历（即不会递归遍历子目录）之外，其他的方法都可以进行深入递归遍历。从结果看，SEL(enumeratorAtPath:)性能之低，实在让人感觉到惊奇，该方法适用于大型的文件系统树(Because the enumeration is deep—that is, it lists the contents of all subdirectories—this enumerator object is useful for performing actions that involve large file-system subtrees)，以时间换空间，但enumeratorAtURL明显是更高效的方法； 假如需要获取遍历目录下文件的信息，SEL(enumeratorAtURL:includingPropertiesForKeys:options:errorHandler:) 方法是非常值得推荐的遍历方式，而假如只是想统计遍历目录下的文件数，SEL(contentsOfDirectoryAtPath:error:)  和  SEL(subpathsOfDirectoryAtPath:error:)  可满足需求。


&nbsp;

## 2、文件操作

#### 1）创建文件
API:
<div>
<pre><code>- (BOOL)createFileAtPath:(NSString *)path contents:(NSData *)data attributes:(NSDictionary *)attr;
- (BOOL)writeToFile:(NSString *)path atomically:(BOOL)useAuxiliaryFile;
- (BOOL)writeToURL:(NSURL *)url atomically:(BOOL)atomically; </code></pre>
</div>
&nbsp;
Benchmark结果：  
目标路径文件不存在  
SEL(createFileAtPath: contents: attributes:)  
文件大小：0KB             次数：1000次(1K次)               耗时：4.140s ~ 4.150s  
文件大小：1MB            次数：1000次(1K次)               耗时：28.900s ~ 29.000s

SEL(writeToFile:atomically:)  
atomically:YES    文件大小：0KB                    次数：1000次               耗时：4.150s ~ 4.160s  
atomically:NO      文件大小：0KB                    次数：1000次               耗时：1.010s ~ 1.020s  
atomically:YES    文件大小：1MB                    次数：1000次               耗时：28.900s ~ 29.000s  
atomically:NO      文件大小：1MB                    次数：1000次               耗时：24.600s ~ 25.000s

目标路径文件已存在  
SEL(createFileAtPath: contents: attributes:)  
文件大小：0KB               次数：1000次               耗时：5.540s ~ 5.550s  
文件大小：1MB               次数：1000次               耗时：30.000s ~ 31.000s

SEL(writeToFile:atomically:)  
atomically:YES    文件大小：0KB               次数：1000次               耗时：5.540s ~ 5.550s    
atomically:NO      文件大小：0KB               次数：1000次               耗时：0.600s ~ 0.610s
atomically:YES    文件大小：1MB               次数：1000次               耗时：30.000s ~ 31.000s  
atomically:NO      文件大小：1MB               次数：1000次               耗时：26.000s ~ 27.000s  


从测试来看，创建文件方法SEL(createFileAtPath: contents: attributes: )与SEL(writeToFile:atomically:YES)在效率上没有什么区别，因此估计两者使用了逻辑是一致的；SEL(writeToFile:atomically:NO) 比SEL(writeToFile:atomically:YES)效率高也是合乎情理（因为atomically:YES是先写到一个临时备份文件然后再改名的，以此来保证操作的原子性，防止写数据过程中出现其他错误），但需要注意的是，在创建空文件时，SEL(writeToFile:atomically:NO)效率非常之高，可以考虑在频繁创建空文件的时候使用SEL(writeToFile:atomically:NO)。

#### 2）拷贝文件
API:
<div>
<pre><code>- (BOOL)copyItemAtPath:(NSString *)srcPath toPath:(NSString *)dstPath error:(NSError **)error
- (BOOL)copyItemAtURL:(NSURL *)srcURL toURL:(NSURL *)dstURL error:(NSError **)error</code></pre>
</div>

Benchmark结果：  
文件大小：1MB            次数：1000次               耗时：40.800s ~ 42.000s  
文件大小：2MB            次数：1000次               耗时：76.700s ~ 77.000s

#### 3）移动文件
API:  
- (BOOL)moveItemAtPath:(NSString *)srcPath toPath:(NSString *)dstPath error:(NSError \*\*)error  
- (BOOL)moveItemAtURL:(NSURL *)srcURL toURL:(NSURL *)dstURL error:(NSError **)error

Benchmark结果：  
文件大小：1MB~1GB            次数：1000次               耗时：1.260s ~ 1.580s

&nbsp;

#### 4）删除文件
API:
<div>
<pre><code>- (BOOL)removeItemAtPath:(NSString *)path error:(NSError **)error
- (BOOL)removeItemAtURL:(NSURL *)URL error:(NSError **)error</code></pre>
</div>

Benchmark结果：
文件大小：1MB~10M            次数：1000次               耗时：1.560s ~ 1.680s


#### 5）创建硬链接
API：
<div>
<pre><code>- (BOOL)linkItemAtPath:(NSString *)srcPath toPath:(NSString *)dstPath error:(NSError **)error 
- (BOOL)linkItemAtURL:(NSURL *)srcURL toURL:(NSURL *)dstURL error:(NSError **)error </code></pre>
</div>
&nbsp;
Benchmark结果：  
目标路径文件不存在                    文件大小：1MB~1G                     次数：1000次               耗时：7.550s ~ 7.600s  
目标路径文件存在（不会覆盖）  文件大小：1MB~1G                     次数：1000次               耗时：7.100s ~ 7.400s

创建文件硬链接在效率上与文件大小无关，而且硬链接所占用的空间极小，因此是拷贝文件非常好的替换方法。需要注意的是，针对目录创建硬链接，会创建一个新的目标目录，然后对源目录里面的文件创建硬链接。为了避免无限递归，在子目录里面创建目录的硬链接是不被允许的。


#### 6）创建软链接

API：
<div>
<pre><code>- (BOOL)linkItemAtPath:(NSString *)srcPath toPath:(NSString *)dstPath error:(NSError **)error 
- (BOOL)linkItemAtURL:(NSURL *)srcURL toURL:(NSURL *)dstURL error:(NSError **)error </code></pre>
</div>
&nbsp;
Benchmark结果：  
目标路径文件不存在                    文件大小：1MB~1G                     次数：1000次               耗时：1.360s ~ 1.520s  
目标路径文件存在（不会覆盖）  文件大小：1MB~1G                     次数：1000次               耗时：0.480s ~ 0.530s  


文件操作总结：从1) ~ 6)的Benchmark可以看出拷贝文件和写文件一样，需要频繁的IO操作，耗时随着文件增大而拉长；而移动文件、删除文件、创建软硬链则与文件的大小无关，这些都符合我们的预期 。


&nbsp;

## 3、文件Handle读写

将文件读写的Benchmark独立出来是因为文件读写主要测试的是NSFileHandle的性能，而不再是NSFileManager的操作性能测试了。


#### 1）写文件：
API：
<div>
<pre><code>- (void)writeData:(NSData *)data;
- (void)synchronizeFile;</code></pre>
</div>

Benchmark结果  
写入数据：512KB/次         次数：2000次          总大小：1GB               耗时：15.400s ~ 15.800s(最后Syn)  /  29.600s ~ 30.000s(每次Syn)  
写入数据：1MB/次             次数：1000次          总大小：1GB               耗时：15.400s ~ 15.800s(最后Syn)  /  24.400s ~ 25.200s(每次Syn)  
写入数据：2MB/次             次数：500次            总大小：1GB               耗时：15.400s ~ 15.800s(最后Syn)  /  21.400s ~ 21.800s(每次Syn)  
写入数据：4MB/次             次数：250次            总大小：1GB               耗时：15.400s ~ 15.800s(最后Syn)  /  20.500s ~ 20.800s(每次Syn)  
写入数据：8MB/次             次数：125次            总大小：1GB               耗时：15.400s ~ 15.800s(最后Syn)  /  20.300s ~ 20.600s(每次Syn)  

ps：Syn表示调用synchronizeFile来flush缓存
从上面的Benchmark可以看到，对于一定量的数据来说，缓冲区到硬盘的IO操作是由系统控制的，因此只在最后Syn的情况下，各种大小的字节数据writeData写入缓冲区使用的时间几乎是一样的，而每次writeData之后立刻调用Syn，则会让IO的操作增加，导致耗时的增加。所以，假如数据是可恢复的，那建议在写完数据所有数据之后再调用Syn。IO的写入效率为65M/s左右。


#### 2）读文件：
API：
<div>
<pre><code>- (NSData *)readDataToEndOfFile; - (NSData *)readDataOfLength:(NSUInteger)length;</code></pre>
</div>
&nbsp;
Benchmark结果  
读取数据：1KB/次              次数：1024^2次       总大小：1GB               耗时：32.200s ~ 32.500s   
读取数据：126KB/次          次数：4096次          总大小：1GB               耗时：11.100s ~ 11.300s  
读取数据：256KB/次          次数：4096次          总大小：1GB               耗时：10.800s ~ 11.000s  
读取数据：512KB/次          次数：2048次          总大小：1GB               耗时：10.300s ~ 10.600s  
读取数据：1MB/次             次数：1024次          总大小：1GB               耗时：10.600s ~ 10.800s  
读取数据：2MB/次             次数：512次            总大小：1GB               耗时：10.600s ~ 10.800s  
读取数据：4MB/次             次数：256次            总大小：1GB               耗时：10.600s ~ 10.800s  
读取数据：8MB/次             次数：128次            总大小：1GB               耗时：10.000s ~ 10.200s  

从上面的benchmark发现，读512KB到8M各种大小规格数据块，效率上差别不大（相对于IO，遍历2000次与125次的差别微乎其微，因此忽略），但可看到从256KB逐步减小每次读取的数据块开始，耗时开始增加，当每次读取1KB的时候，耗时拉长到3倍，原因是没有充分利用IO缓冲区，增加了IO操作次数导致的；在现有的系统环境下，单次读取数据再继续往上测试的意义不大（单次读取16M、32M占用内存过大）。由测试得出，在现有测试环境下，每次读取数据块合理大小为512KB~4MB，IO读取效率为 100M/s 左右。

>引自Apple 文档：https://developer.apple.com/library/ios/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/PerformanceTips/PerformanceTips.html
Choose an appropriate read buffer size. When reading data from the disk to a local buffer, the buffer size you choose can have a dramatic effect on the speed of the operation. If you are working with relatively large files, it does not make sense to allocate a 1K buffer to read and process the data in small chunks. Instead, create a larger buffer (say 128K to 256K in size) and read much or all of the data into memory before processing it. The same rules apply for writing data to the disk: write data as sequentially as you can using a single file-system call.

#### 3）Seek文件：
API：
<div>
<pre><code>- (unsigned long long)seekToEndOfFile; - (void)seekToFileOffset:(unsigned long long)offset;</code></pre>
</div>
Benchmark结果(生成随机数随机seek)：  
文件大小：1GB              次数：1,000,000次            耗时：3.000s ~ 3.200s

Seek文件是一个非常高效的操作，做一次seek操作，相当于遍历一个10个元素的数组。

总结：  
以上的Benchmark，由于受限于测试环境，未必准确，而且在不同的设备上体现也不一样，其主要的目的是，让我们对IO操作的性能有个数据图像上的理解。当然，此次Benchmark调用的API都是比较cocoa上层的API，假如使用Linux的IO库来进行操作，相信效率会有不同的展现，这个就留待后续发掘吧。

PS：很多IO操作的API中，都提供了path(NSString)和url(NSURL)两种参数方式，我们一直习惯使用path的方式，但官方文档提供的指导是推荐使用NSURL：

>引自Apple 文档：
[https://developer.apple.com/library/ios/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/PerformanceTips/PerformanceTips.html](https://developer.apple.com/library/ios/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/PerformanceTips/PerformanceTips.html)

When deciding which routines to call, choose ones that let you specify paths using NSURL objects over those that specify paths using strings. Most of the URL-based routines were introduced in OS X 10.6 and later and were designed from the beginning to take advantage of technologies like Grand Central Dispatch. This gives your code an immediate advantage on multicore computers while not requiring you to do much work.
Reuse path objects. If you take the time to create an NSURL for a file, reuse that object as much as you can rather than create it each time you need it. Locating files and building URLs or pathname information takes time and can be expensive. Reusing the objects created from those operations saves time and minimizes your app’s interactions with the file system.


更多iOS文件系统相关信息，请查看：File System Programming Guide

<p>{{ page.date | date_to_string}}</p>
