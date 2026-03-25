FROM maven:3.9.6-eclipse-temurin-17

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY . .

EXPOSE 8080

# Remove stale compiled migration file before run (target is a mounted volume)
CMD ["sh", "-c", "rm -f /app/target/classes/db/migration/V4__survey_enhancements.sql && mvn spring-boot:run"]