FROM php:8.2-apache
RUN a2enmod rewrite
RUN docker-php-ext-install pdo pdo_mysql dom
WORKDIR /var/www/html
COPY . /var/www/html
EXPOSE 80
