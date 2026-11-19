# Un-project a piece of the museum's axonometric visitor map into a true plan, with a metre grid.
import sys,json,numpy as np,cv2
def rectify(src,o_px,o_m,ex,ez,box,out,ppm=9,grid=5,label=10):
    im=cv2.imread(src); x0,z0,x1,z1=box; W,H=int((x1-x0)*ppm),int((z1-z0)*ppm)
    # plan pixel (u,v) -> metres -> map pixel
    A=np.array([[ex[0]/ppm,ez[0]/ppm,o_px[0]+(x0-o_m[0])*ex[0]+(z0-o_m[1])*ez[0]],[ex[1]/ppm,ez[1]/ppm,o_px[1]+(x0-o_m[0])*ex[1]+(z0-o_m[1])*ez[1]]])
    pl=cv2.warpAffine(im,A,(W,H),flags=cv2.INTER_AREA|cv2.WARP_INVERSE_MAP,borderValue=(255,255,255))
    g=int(np.ceil(x0/grid)*grid)
    while g<x1:
        u=int((g-x0)*ppm); major=g%label==0; cv2.line(pl,(u,0),(u,H),(0,0,255) if major else (255,170,170),1)
        if major: cv2.putText(pl,str(g),(u+2,11),cv2.FONT_HERSHEY_SIMPLEX,0.38,(0,0,255),1); cv2.putText(pl,str(g),(u+2,H-4),cv2.FONT_HERSHEY_SIMPLEX,0.38,(0,0,255),1)
        g+=grid
    g=int(np.ceil(z0/grid)*grid)
    while g<z1:
        v=int((g-z0)*ppm); major=g%label==0; cv2.line(pl,(0,v),(W,v),(0,0,255) if major else (255,170,170),1)
        if major: cv2.putText(pl,str(g),(2,v-2),cv2.FONT_HERSHEY_SIMPLEX,0.38,(0,0,255),1); cv2.putText(pl,str(g),(W-28,v-2),cv2.FONT_HERSHEY_SIMPLEX,0.38,(0,0,255),1)
        g+=grid
    cv2.imwrite(out,pl)
