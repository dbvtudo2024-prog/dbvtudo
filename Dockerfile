FROM php:8.2-apache

# Instalar dependências do sistema necessárias para as extensões PHP
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite
RUN docker-php-ext-install pdo pdo_mysql dom
WORKDIR /var/www/html
COPY . /var/www/html
EXPOSE 80
