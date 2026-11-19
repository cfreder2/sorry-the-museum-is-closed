import numpy as np,sys,json
from PIL import Image
from scipy import ndimage as ndi
def seg(path,box,pal,to_m,minarea=6.0,tol=16):
    im=np.asarray(Image.open(path).convert('RGB').crop(box)).astype(int)
    out=[]
    for name,c in pal.items():
        m=(np.abs(im-np.array(c)).max(axis=2)<=tol)
        m=ndi.binary_closing(m,iterations=2); m=ndi.binary_opening(m,iterations=2)
        lab,n=ndi.label(m)
        for i,s in enumerate(ndi.find_objects(lab)):
            a=(lab[s]==i+1).sum()
            x0,z0=to_m(s[1].start+box[0],s[0].start+box[1]); x1,z1=to_m(s[1].stop+box[0],s[0].stop+box[1])
            am=a*(x1-x0)*(z1-z0)/((s[1].stop-s[1].start)*(s[0].stop-s[0].start))
            if am>=minarea: out.append(dict(c=name,x0=round(x0,1),x1=round(x1,1),z0=round(z0,1),z1=round(z1,1),area=round(am),fill=round(a/((s[1].stop-s[1].start)*(s[0].stop-s[0].start)),2),px=[s[1].start+box[0],s[1].stop+box[0],s[0].start+box[1],s[0].stop+box[1]]))
    return out
