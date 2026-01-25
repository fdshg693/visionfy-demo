import cv2

img = cv2.imread("original.png", 0)

# create a CLAHE object (Arguments are optional).
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
cl1 = clahe.apply(img)

cv2.imwrite("clahe_histogram.jpg", cl1)
