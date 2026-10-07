import downloadBlob from '@/helpers/downloadBlob';

describe('downloadBlob', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
    URL.revokeObjectURL = jest.fn();
  });

  it('downloads the blob with the given file name', () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      const link = document.querySelector('a') as HTMLAnchorElement;
      expect(link.href).toEqual('blob:url');
      expect(link.download).toEqual('report.xlsx');
    });
    const blob = new Blob(['data']);

    downloadBlob(blob, 'report.xlsx');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    expect(document.querySelector('a')).toBeNull();
  });
});
