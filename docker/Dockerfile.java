# ========================================
# Java 后端 Dockerfile
# ========================================
# 多阶段构建：先编译，再运行

# 阶段1: 编译
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# 复制 pom 文件（利用 Docker 缓存层）
COPY pom.xml .
COPY ruoyi-admin/pom.xml ruoyi-admin/
COPY ruoyi-common/pom.xml ruoyi-common/
COPY ruoyi-framework/pom.xml ruoyi-framework/
COPY ruoyi-system/pom.xml ruoyi-system/
COPY ruoyi-quartz/pom.xml ruoyi-quartz/
COPY ruoyi-generator/pom.xml ruoyi-generator/

# 下载依赖（缓存层）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY ruoyi-admin/ ruoyi-admin/
COPY ruoyi-common/ ruoyi-common/
COPY ruoyi-framework/ ruoyi-framework/
COPY ruoyi-system/ ruoyi-system/
COPY ruoyi-quartz/ ruoyi-quartz/
COPY ruoyi-generator/ ruoyi-generator/

# 编译打包
RUN mvn clean package -DskipTests -B

# 阶段2: 运行
FROM eclipse-temurin:17-jre

WORKDIR /app

# 创建非 root 用户
RUN useradd -r -s /bin/false ruoyi && \
    mkdir -p /home/ruoyi/uploadPath && \
    chown -R ruoyi:ruoyi /home/ruoyi

# 从编译阶段复制 JAR 文件
COPY --from=builder /build/ruoyi-admin/target/ruoyi-admin.jar app.jar

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 切换到非 root 用户
USER ruoyi

# 暴露端口
EXPOSE 8080

# 启动命令
ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "app.jar"]
