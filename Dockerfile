# Gunakan image Nginx yang ringan
FROM nginx:alpine

# Salin file dari folder saat ini ke direktori Nginx
# Titik (.) pertama adalah folder di laptopmu
# Jalur kedua adalah folder tujuan di dalam container
COPY . /usr/share/nginx/html

# Port 80
EXPOSE 80

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]